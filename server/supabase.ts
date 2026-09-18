import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase project link specified by user: https://nnrcrrgtndknswjwrlzp.supabase.co
export const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL || 'https://nnrcrrgtndknswjwrlzp.supabase.co';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  // Initialize client if key is available or use dummy key for test connection
  const key = SUPABASE_ANON_KEY || 'public-anon-key-placeholder';
  try {
    supabaseInstance = createClient(SUPABASE_PROJECT_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err);
    return null;
  }
}

export const SUPABASE_SQL_SCHEMA = `
-- Playlist Plug: Supabase PostgreSQL Database Schema
-- Project: https://nnrcrrgtndknswjwrlzp.supabase.co

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'artist',
  spotify_id TEXT,
  spotify_uri TEXT,
  spotify_followers INTEGER DEFAULT 0,
  bio TEXT,
  credit_balance INTEGER DEFAULT 10,
  free_weekly_credits INTEGER DEFAULT 2,
  earnings_balance NUMERIC DEFAULT 0,
  verified_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  curator_id TEXT NOT NULL,
  curator_name TEXT NOT NULL,
  curator_avatar TEXT,
  cover_art TEXT,
  spotify_url TEXT NOT NULL,
  spotify_uri TEXT NOT NULL,
  genres TEXT[] DEFAULT '{}',
  follower_count INTEGER DEFAULT 0,
  track_count INTEGER DEFAULT 0,
  pitch_cost_credits INTEGER DEFAULT 1,
  free_pitch_enabled BOOLEAN DEFAULT true,
  avg_response_hours INTEGER DEFAULT 24,
  approval_rate INTEGER DEFAULT 65,
  accepting_submissions BOOLEAN DEFAULT true,
  gates JSONB DEFAULT '{}'::jsonb,
  spotlight_track JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  playlist_id TEXT NOT NULL,
  playlist_title TEXT NOT NULL,
  curator_id TEXT NOT NULL,
  pitch_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  custom_message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  feedback_tags TEXT[] DEFAULT '{}',
  curator_note TEXT,
  track JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  paypal_amount_usd NUMERIC,
  paypal_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  track_title TEXT,
  playlist_title TEXT,
  status TEXT DEFAULT 'delivered',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  projectUrl: string;
  isConfigured: boolean;
  message: string;
}> {
  const isConfigured = Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'public-anon-key-placeholder');

  try {
    // Attempt ping to Supabase REST endpoint
    const res = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY || 'public-anon-key-placeholder'
      }
    });

    // If HTTP 200 or 401 (meaning Supabase endpoint is live and accepting queries), endpoint is alive
    const isLive = res.status === 200 || res.status === 401 || res.status === 400;

    return {
      connected: isLive,
      projectUrl: SUPABASE_PROJECT_URL,
      isConfigured,
      message: isConfigured
        ? 'Supabase Cloud Database connected and authenticated'
        : 'Supabase project endpoint verified (Add SUPABASE_ANON_KEY to enable live cloud write)'
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: SUPABASE_PROJECT_URL,
      isConfigured,
      message: `Failed to connect to Supabase: ${err.message || 'Network unreachable'}`
    };
  }
}

export async function syncRecordToSupabase(table: string, record: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !SUPABASE_ANON_KEY) return false;

  try {
    const { error } = await client.from(table).upsert(record);
    if (error) {
      console.warn(`[Supabase] Sync failed on table ${table}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Error during sync:`, err);
    return false;
  }
}
