-- ==============================================================================
-- PLAYLIST PLUG: SUPABASE POSTGRESQL PRODUCTION MIGRATION & RLS POLICIES
-- Target: Supabase Postgres
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('artist', 'curator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status_type AS ENUM ('pending', 'approved', 'declined', 'added_to_playlist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pitch_type_enum AS ENUM ('free', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'artist' CHECK (role IN ('artist', 'curator', 'admin')),
  credit_balance INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  free_weekly_credits INTEGER NOT NULL DEFAULT 2 CHECK (free_weekly_credits >= 0),
  last_weekly_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bio TEXT,
  spotify_id TEXT,
  spotify_uri TEXT,
  spotify_followers INTEGER DEFAULT 0,
  curator_status TEXT NOT NULL DEFAULT 'none' CHECK (curator_status IN ('none', 'pending', 'approved', 'rejected')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on Supabase auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'artist'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(public.profiles.name, EXCLUDED.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS public.playlists (
  id TEXT PRIMARY KEY DEFAULT ('pl_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  curator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  curator_name TEXT NOT NULL,
  curator_avatar TEXT,
  curator_spotify_id TEXT,
  cover_art TEXT,
  spotify_url TEXT NOT NULL,
  spotify_uri TEXT NOT NULL,
  follower_count INTEGER NOT NULL DEFAULT 0,
  track_count INTEGER NOT NULL DEFAULT 0,
  genres TEXT[] NOT NULL DEFAULT '{}',
  pitch_cost_credits INTEGER NOT NULL DEFAULT 1 CHECK (pitch_cost_credits >= 1),
  free_pitch_enabled BOOLEAN NOT NULL DEFAULT true,
  avg_response_hours INTEGER NOT NULL DEFAULT 24,
  approval_rate INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_code TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  spotlight_track JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  track_id TEXT NOT NULL,
  track JSONB NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  artist_avatar TEXT,
  playlist_id TEXT NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  playlist_title TEXT NOT NULL,
  playlist_cover TEXT,
  curator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  curator_name TEXT NOT NULL,
  pitch_type TEXT NOT NULL CHECK (pitch_type IN ('free', 'premium')),
  pitch_cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'added_to_playlist')),
  custom_message TEXT,
  feedback_tags TEXT[] DEFAULT '{}',
  feedback_note TEXT,
  spotify_placement_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 6. CREDIT LEDGER TABLE (Append-Only Transaction Journal)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id TEXT PRIMARY KEY DEFAULT ('tx_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'free_pitch', 'premium_pitch', 'refund', 'weekly_reset', 'admin_adjustment')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  paypal_order_id TEXT UNIQUE,
  paypal_amount_usd NUMERIC(10, 2),
  paypal_payer_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. REPORTS TABLE (Abuse & Moderation)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY DEFAULT ('rep_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reporter_email TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('playlist', 'submission', 'user', 'track')),
  target_id TEXT NOT NULL,
  target_title TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 8. EMAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.email_logs (
  id TEXT PRIMARY KEY DEFAULT ('em_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  track_title TEXT,
  playlist_title TEXT,
  status TEXT NOT NULL DEFAULT 'delivered',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_playlists_curator_id ON public.playlists(curator_id);
CREATE INDEX IF NOT EXISTS idx_playlists_is_active ON public.playlists(is_active);
CREATE INDEX IF NOT EXISTS idx_submissions_artist_id ON public.submissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_submissions_curator_id ON public.submissions(curator_id);
CREATE INDEX IF NOT EXISTS idx_submissions_playlist_id ON public.submissions(playlist_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON public.credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_paypal_order ON public.credit_ledger(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- A. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (to show curator name, bio, and artist details on tracks)
CREATE POLICY "Public profiles read" ON public.profiles
  FOR SELECT USING (true);

-- Users can only edit their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- B. PLAYLISTS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- The public can read only live playlists
CREATE POLICY "Public can view live playlists" ON public.playlists
  FOR SELECT USING (is_active = true AND verification_status = 'verified');

-- Curators can view all their own playlists (including pending verification / inactive)
CREATE POLICY "Curators can view own playlists" ON public.playlists
  FOR SELECT USING (auth.uid() = curator_id);

-- Curators can insert their own playlists
CREATE POLICY "Curators can insert own playlists" ON public.playlists
  FOR INSERT WITH CHECK (auth.uid() = curator_id);

-- Curators can update their own playlists
CREATE POLICY "Curators can update own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = curator_id);

-- Curators can delete their own playlists
CREATE POLICY "Curators can delete own playlists" ON public.playlists
  FOR DELETE USING (auth.uid() = curator_id);

-- C. SUBMISSIONS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Artists can see their own submissions
CREATE POLICY "Artists can view own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = artist_id);

-- Curators can see submissions to their own playlists
CREATE POLICY "Curators can view submissions to own playlists" ON public.submissions
  FOR SELECT USING (auth.uid() = curator_id);

-- Artists can insert submissions
CREATE POLICY "Artists can insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = artist_id);

-- Curators can update submissions to their own playlists (to approve/decline)
CREATE POLICY "Curators can update submissions to own playlists" ON public.submissions
  FOR UPDATE USING (auth.uid() = curator_id);

-- D. CREDIT LEDGER (TRANSACTIONS)
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read only their own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Notice: NO direct INSERT/UPDATE/DELETE policies for authenticated or anon!
-- Only Postgres functions (SECURITY DEFINER) and service_role can modify the credit ledger!

-- E. REPORTS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can insert reports
CREATE POLICY "Users can submit reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- F. EMAIL LOGS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service and admin read email logs" ON public.email_logs
  FOR SELECT USING (false); -- Only service role can read logs directly

-- ==============================================================================
-- 11. ATOMIC POSTGRES FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- 1. Atomic Credit Top-up (Idempotent with PayPal Order ID)
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID,
  p_amount INT,
  p_type TEXT,
  p_description TEXT,
  p_paypal_order_id TEXT DEFAULT NULL,
  p_paypal_amount_usd NUMERIC DEFAULT NULL,
  p_paypal_payer_email TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_existing_tx RECORD;
  v_new_balance INT;
  v_tx_id TEXT;
BEGIN
  -- Idempotency check if PayPal order ID is provided
  IF p_paypal_order_id IS NOT NULL THEN
    SELECT * INTO v_existing_tx FROM public.credit_ledger WHERE paypal_order_id = p_paypal_order_id;
    IF FOUND THEN
      SELECT credit_balance INTO v_new_balance FROM public.profiles WHERE id = p_user_id;
      RETURN jsonb_build_object(
        'success', true,
        'idempotent', true,
        'transaction_id', v_existing_tx.id,
        'new_balance', v_new_balance
      );
    END IF;
  END IF;

  -- Generate transaction ID
  v_tx_id := 'tx_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);

  -- Insert ledger entry
  INSERT INTO public.credit_ledger (
    id, user_id, amount, type, description, status,
    paypal_order_id, paypal_amount_usd, paypal_payer_email, created_at
  ) VALUES (
    v_tx_id, p_user_id, p_amount, p_type, p_description, 'completed',
    p_paypal_order_id, p_paypal_amount_usd, p_paypal_payer_email, NOW()
  );

  -- Increment user credit balance
  UPDATE public.profiles
  SET credit_balance = credit_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'transaction_id', v_tx_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atomic Pitch Submission with Credits Deduction
CREATE OR REPLACE FUNCTION public.spend_credits_and_create_submission(
  p_artist_id UUID,
  p_playlist_id TEXT,
  p_track JSONB,
  p_pitch_type TEXT,
  p_custom_message TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_playlist RECORD;
  v_artist RECORD;
  v_pitch_cost INT;
  v_sub_id TEXT;
  v_submission RECORD;
BEGIN
  -- 1. Fetch playlist
  SELECT * INTO v_playlist FROM public.playlists WHERE id = p_playlist_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Playlist with ID % does not exist', p_playlist_id;
  END IF;

  IF NOT v_playlist.is_active THEN
    RAISE EXCEPTION 'Playlist is currently not accepting submissions';
  END IF;

  -- 2. Fetch artist profile
  SELECT * INTO v_artist FROM public.profiles WHERE id = p_artist_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artist profile not found';
  END IF;

  -- 3. Calculate cost and verify balance
  IF p_pitch_type = 'free' THEN
    IF NOT v_playlist.free_pitch_enabled THEN
      RAISE EXCEPTION 'Free pitches are not enabled for this playlist';
    END IF;
    IF v_artist.free_weekly_credits < 1 THEN
      RAISE EXCEPTION 'No free weekly pitches remaining. Please top up credits or wait for reset.';
    END IF;
    v_pitch_cost := 0;

    -- Deduct free weekly credit
    UPDATE public.profiles
    SET free_weekly_credits = free_weekly_credits - 1,
        updated_at = NOW()
    WHERE id = p_artist_id;

    -- Record ledger debit (0 cost)
    INSERT INTO public.credit_ledger (user_id, amount, type, description)
    VALUES (p_artist_id, 0, 'free_pitch', 'Free Weekly Pitch: ' || (p_track->>'title') || ' to ' || v_playlist.title);

  ELSE
    v_pitch_cost := COALESCE(v_playlist.pitch_cost_credits, 1);
    IF v_artist.credit_balance < v_pitch_cost THEN
      RAISE EXCEPTION 'Insufficient credit balance (% required, % available)', v_pitch_cost, v_artist.credit_balance;
    END IF;

    -- Deduct credits
    UPDATE public.profiles
    SET credit_balance = credit_balance - v_pitch_cost,
        updated_at = NOW()
    WHERE id = p_artist_id;

    -- Record ledger debit
    INSERT INTO public.credit_ledger (user_id, amount, type, description)
    VALUES (p_artist_id, -v_pitch_cost, 'premium_pitch', 'Premium Pitch: ' || (p_track->>'title') || ' to ' || v_playlist.title);
  END IF;

  -- 4. Create submission
  v_sub_id := 'sub_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
  INSERT INTO public.submissions (
    id, track_id, track, artist_id, artist_name, artist_avatar,
    playlist_id, playlist_title, playlist_cover, curator_id, curator_name,
    pitch_type, pitch_cost, custom_message, status, submitted_at
  ) VALUES (
    v_sub_id,
    COALESCE(p_track->>'id', 'trk_' || substr(md5(random()::text), 1, 8)),
    p_track,
    p_artist_id,
    v_artist.name,
    v_artist.avatar_url,
    v_playlist.id,
    v_playlist.title,
    v_playlist.cover_art,
    v_playlist.curator_id,
    v_playlist.curator_name,
    p_pitch_type,
    v_pitch_cost,
    p_custom_message,
    'pending',
    NOW()
  )
  RETURNING * INTO v_submission;

  RETURN row_to_json(v_submission)::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atomic Refund for Expired or Admin-Refunded Submissions
CREATE OR REPLACE FUNCTION public.refund_submission_credits(
  p_submission_id TEXT,
  p_reason TEXT DEFAULT '48-Hour SLA Guarantee Exceeded'
)
RETURNS JSONB AS $$
DECLARE
  v_sub RECORD;
  v_new_balance INT;
BEGIN
  SELECT * INTO v_sub FROM public.submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF v_sub.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending submissions can be refunded';
  END IF;

  -- Mark submission as declined/refunded
  UPDATE public.submissions
  SET status = 'declined',
      feedback_note = 'Refunded: ' || p_reason,
      reviewed_at = NOW()
  WHERE id = p_submission_id;

  -- If premium pitch, refund credits
  IF v_sub.pitch_cost > 0 THEN
    UPDATE public.profiles
    SET credit_balance = credit_balance + v_sub.pitch_cost,
        updated_at = NOW()
    WHERE id = v_sub.artist_id
    RETURNING credit_balance INTO v_new_balance;

    INSERT INTO public.credit_ledger (user_id, amount, type, description)
    VALUES (v_sub.artist_id, v_sub.pitch_cost, 'refund', 'Credit Refund (' || p_reason || '): ' || (v_sub.track->>'title'));
  ELSE
    -- Restore free credit
    UPDATE public.profiles
    SET free_weekly_credits = free_weekly_credits + 1,
        updated_at = NOW()
    WHERE id = v_sub.artist_id;
    SELECT credit_balance INTO v_new_balance FROM public.profiles WHERE id = v_sub.artist_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'refunded_amount', v_sub.pitch_cost,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
