-- ==============================================================================
-- PLAYLIST PLUG: SECURITY HARDENING, FUNCTION LOCKDOWN & SCHEDULED JOBS
-- Migration: 20261102000000_security_hardening_and_scheduler.sql
-- ==============================================================================

-- 1. LOCK DOWN ATOMIC FUNCTIONS
-- Revoke EXECUTE on all three functions from PUBLIC, anon, and authenticated
-- Grant EXECUTE exclusively to service_role and set search_path = public on each

-- 1a. credit_wallet
ALTER FUNCTION public.credit_wallet(UUID, INT, TEXT, TEXT, TEXT, NUMERIC, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION public.credit_wallet(UUID, INT, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet(UUID, INT, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO service_role;

-- 1b. spend_credits_and_create_submission
ALTER FUNCTION public.spend_credits_and_create_submission(UUID, TEXT, JSONB, TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION public.spend_credits_and_create_submission(UUID, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits_and_create_submission(UUID, TEXT, JSONB, TEXT, TEXT) TO service_role;

-- 1c. refund_submission_credits
ALTER FUNCTION public.refund_submission_credits(TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION public.refund_submission_credits(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_submission_credits(TEXT, TEXT) TO service_role;

-- 2. HANDLE_NEW_USER ROLE RESTRICTION
-- Accept only 'artist' or 'curator' and ignore anything else (defaulting safely to 'artist')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_raw_role TEXT;
BEGIN
  v_raw_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', '')));
  IF v_raw_role IN ('artist', 'curator') THEN
    v_role := v_raw_role;
  ELSE
    v_role := 'artist';
  END IF;

  INSERT INTO public.profiles (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(public.profiles.name, EXCLUDED.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. PROFILES COLUMN-LEVEL UPDATE PERMISSION
-- Revoke broad UPDATE on profiles from authenticated and grant it ONLY on (name, bio, avatar_url)
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, bio, avatar_url) ON public.profiles TO authenticated;

-- 4. LIMITED PUBLIC VIEW FOR PROFILES & OWN-ROW SELECT
-- Replace public profiles SELECT with limited public view (id, name, avatar_url, role)
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, name, avatar_url, role
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 5. REMOVE DIRECT CLIENT WRITE POLICIES
-- Writes go through the verified server only

-- 5a. Submissions: Remove client direct INSERT and curator direct UPDATE
DROP POLICY IF EXISTS "Artists can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Curators can update submissions to own playlists" ON public.submissions;

-- 5b. Playlists: Remove client direct INSERT, UPDATE, and DELETE
DROP POLICY IF EXISTS "Curators can insert own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Curators can update own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Curators can delete own playlists" ON public.playlists;

-- 6. REALTIME REPLICATION PUBLICATION
-- Add submissions and credit_ledger to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_ledger;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 7. AUDIT PRESERVATION: CREDIT LEDGER FOREIGN KEY
-- Change ledger foreign key so deleting a user does not delete financial records (audit trail intact)
ALTER TABLE public.credit_ledger ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_user_id_fkey;
ALTER TABLE public.credit_ledger
  ADD CONSTRAINT credit_ledger_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 8. SCHEDULED BACKGROUND JOBS (WEEKLY RESET & 48H SLA AUTO-REFUND)
CREATE OR REPLACE FUNCTION public.reset_weekly_free_credits()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET free_weekly_credits = 2,
      last_weekly_reset = NOW()
  WHERE last_weekly_reset < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_refund_sla_breaches()
RETURNS VOID AS $$
DECLARE
  v_sub RECORD;
BEGIN
  FOR v_sub IN
    SELECT id FROM public.submissions
    WHERE status = 'pending'
      AND submitted_at < NOW() - INTERVAL '48 hours'
  LOOP
    PERFORM public.refund_submission_credits(v_sub.id, '48-Hour SLA Guarantee Auto-Refund');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule via pg_cron extension if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('weekly-credit-reset', '0 0 * * 1', 'SELECT public.reset_weekly_free_credits();');
    PERFORM cron.schedule('hourly-sla-auto-refund', '0 * * * *', 'SELECT public.auto_refund_sla_breaches();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
