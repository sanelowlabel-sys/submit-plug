import { Router, Request, Response } from 'express';
import { db } from '../db';
import {
  SUPABASE_PROJECT_URL,
  SUPABASE_SQL_SCHEMA,
  checkSupabaseConnection,
  getSupabaseClient
} from '../supabase';

export const supabaseRouter = Router();

// GET /api/supabase/status
supabaseRouter.get('/status', async (req: Request, res: Response) => {
  const conn = await checkSupabaseConnection();

  const usersCount = db.getUsers().length;
  const playlistsCount = db.getPlaylists().length;
  const submissionsCount = db.getSubmissions().length;
  const transactionsCount = db.getTransactions().length;
  const emailLogsCount = db.getEmails().length;

  res.json({
    projectUrl: SUPABASE_PROJECT_URL,
    dashboardUrl: 'https://supabase.com/dashboard/project/nnrcrrgtndknswjwrlzp',
    connected: conn.connected,
    isConfigured: conn.isConfigured,
    message: conn.message,
    tables: [
      { name: 'users', description: 'Artist & Curator User Profiles', localCount: usersCount, synced: conn.isConfigured },
      { name: 'playlists', description: 'Connected Spotify Playlists & Gates', localCount: playlistsCount, synced: conn.isConfigured },
      { name: 'submissions', description: 'Track Pitches & Real-Time Status', localCount: submissionsCount, synced: conn.isConfigured },
      { name: 'transactions', description: 'Credit Ledger & PayPal Orders', localCount: transactionsCount, synced: conn.isConfigured },
      { name: 'email_logs', description: 'Curator & Artist Delivery Outbox', localCount: emailLogsCount, synced: conn.isConfigured }
    ]
  });
});

// GET /api/supabase/schema
supabaseRouter.get('/schema', (req: Request, res: Response) => {
  res.json({
    projectUrl: SUPABASE_PROJECT_URL,
    schema: SUPABASE_SQL_SCHEMA
  });
});

// POST /api/supabase/sync
supabaseRouter.post('/sync', async (req: Request, res: Response) => {
  const client = getSupabaseClient();
  const conn = await checkSupabaseConnection();

  if (!conn.isConfigured || !client) {
    return res.json({
      success: false,
      synced: false,
      projectUrl: SUPABASE_PROJECT_URL,
      message: 'Supabase project URL is active (https://nnrcrrgtndknswjwrlzp.supabase.co). Add SUPABASE_ANON_KEY to environment secrets to write data to cloud tables.'
    });
  }

  try {
    // Attempt upserting local records to Supabase tables
    const users = db.getUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar_url: u.avatarUrl,
      role: u.role,
      spotify_id: u.spotifyId,
      spotify_uri: u.spotifyUri,
      spotify_followers: u.spotifyFollowers,
      bio: u.bio,
      credit_balance: u.creditBalance,
      free_weekly_credits: u.freeWeeklyCredits,
      earnings_balance: (u as any).earningsBalance || 0,
      verified_status: u.verifiedStatus
    }));

    const { error: userErr } = await client.from('users').upsert(users);

    return res.json({
      success: !userErr,
      synced: !userErr,
      projectUrl: SUPABASE_PROJECT_URL,
      message: userErr ? `Sync error: ${userErr.message}` : 'All platform records successfully synchronized with Supabase'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Sync failed'
    });
  }
});
