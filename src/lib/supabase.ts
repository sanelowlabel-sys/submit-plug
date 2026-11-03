import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Submission, UserProfile, UserRole } from '../types';

// Supabase Project link: https://nnrcrrgtndknswjwrlzp.supabase.co
export const SUPABASE_PROJECT_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://127.0.0.1:3000');

export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'public-anon-key-placeholder'
);

// Initialize Supabase Client
export const supabase = createClient(
  SUPABASE_PROJECT_URL,
  SUPABASE_ANON_KEY || 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  session?: any;
  requiresEmailConfirmation?: boolean;
}

/**
 * Supabase Email & Password Sign In
 * Supabase Auth is the ONLY login system.
 */
export async function supabaseSignIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication failed' };
  }
}

/**
 * Supabase Email & Password Registration with Email Confirmation
 */
export async function supabaseSignUp(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'artist'
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          role
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if session was granted or if confirmation is required
    const requiresEmailConfirmation = !data.session;

    return {
      success: true,
      user: data.user,
      session: data.session,
      requiresEmailConfirmation
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' };
  }
}

/**
 * Supabase Sign Out
 */
export async function supabaseSignOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Supabase Auth] signOut error:', err);
  }
}

/**
 * Supabase Password Reset Email
 */
export async function supabaseResetPassword(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/?reset=password`
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Password recovery email sent! Check your inbox for the reset link.'
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to send reset email' };
  }
}

/**
 * Returns current access token from active Supabase session
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (e) {
    return null;
  }
}

/**
 * Supabase Realtime (respects RLS)
 * Subscribes to submissions changes for the authenticated user
 */
export function subscribeToRealtimeSubmissions(
  userId: string,
  onPayload: (payload: { eventType: string; new: any; old: any }) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`realtime-submissions-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'submissions'
      },
      (payload) => {
        onPayload({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old
        });
      }
    )
    .subscribe();

  return channel;
}
