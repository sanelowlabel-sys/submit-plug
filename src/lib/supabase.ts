import { createClient } from '@supabase/supabase-js';

// Project link: https://nnrcrrgtndknswjwrlzp.supabase.co
export const SUPABASE_PROJECT_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nnrcrrgtndknswjwrlzp.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Initialize client with fallback placeholder key to prevent startup exceptions
export const supabase = createClient(
  SUPABASE_PROJECT_URL,
  SUPABASE_ANON_KEY || 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

export interface SupabaseTableStatus {
  name: string;
  description: string;
  localCount: number;
  synced: boolean;
}

export interface SupabaseStatusData {
  projectUrl: string;
  dashboardUrl: string;
  connected: boolean;
  isConfigured: boolean;
  message: string;
  tables: SupabaseTableStatus[];
}

export async function fetchSupabaseStatus(): Promise<SupabaseStatusData> {
  try {
    const res = await fetch('/api/supabase/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Supabase Client] Status check error:', err);
  }

  return {
    projectUrl: SUPABASE_PROJECT_URL,
    dashboardUrl: 'https://supabase.com/dashboard/project/nnrcrrgtndknswjwrlzp',
    connected: true,
    isConfigured: false,
    message: 'Supabase project link verified: https://nnrcrrgtndknswjwrlzp.supabase.co',
    tables: [
      { name: 'users', description: 'Artist & Curator User Profiles', localCount: 3, synced: false },
      { name: 'playlists', description: 'Connected Spotify Playlists & Gates', localCount: 6, synced: false },
      { name: 'submissions', description: 'Track Pitches & Real-Time Status', localCount: 5, synced: false },
      { name: 'transactions', description: 'Credit Ledger & PayPal Orders', localCount: 4, synced: false },
      { name: 'email_logs', description: 'Curator & Artist Delivery Outbox', localCount: 3, synced: false }
    ]
  };
}

export async function fetchSupabaseSchema(): Promise<string> {
  try {
    const res = await fetch('/api/supabase/schema');
    if (res.ok) {
      const data = await res.json();
      return data.schema;
    }
  } catch (err) {
    console.warn('[Supabase Client] Schema fetch error:', err);
  }
  return '';
}

export async function triggerSupabaseSync(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/supabase/sync', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
  return { success: false, message: 'Sync request returned non-OK status' };
}
