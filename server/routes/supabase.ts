import { Router, Request, Response } from 'express';
import {
  SUPABASE_PROJECT_URL,
  getMigrationSql,
  checkSupabaseConnection
} from '../supabase';

export const supabaseRouter = Router();

// GET /api/supabase/status
supabaseRouter.get('/status', async (req: Request, res: Response) => {
  const conn = await checkSupabaseConnection();

  res.json({
    projectUrl: SUPABASE_PROJECT_URL,
    dashboardUrl: 'https://supabase.com/dashboard/project/nnrcrrgtndknswjwrlzp',
    connected: conn.connected,
    isConfigured: conn.isConfigured,
    message: conn.message,
    tables: [
      { name: 'profiles', description: 'User Profiles linked to auth.users (RLS enabled)' },
      { name: 'playlists', description: 'Curator Spotify Playlists with one-time verification (RLS enabled)' },
      { name: 'submissions', description: 'Pitch submissions with atomic debit & curator review (RLS enabled)' },
      { name: 'credit_ledger', description: 'Append-only credit journal & PayPal order idempotency (RLS enabled)' },
      { name: 'reports', description: 'Platform abuse and content moderation reports (RLS enabled)' },
      { name: 'email_logs', description: 'Transactional email delivery outbox (RLS enabled)' }
    ]
  });
});

// GET /api/supabase/schema
supabaseRouter.get('/schema', (req: Request, res: Response) => {
  res.json({
    projectUrl: SUPABASE_PROJECT_URL,
    schema: getMigrationSql()
  });
});
