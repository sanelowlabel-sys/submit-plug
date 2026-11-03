import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../supabase';
import { db } from '../db';
import { UserRole } from './validation';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'artist' | 'curator' | 'admin';
  name: string;
  creditBalance: number;
  freeWeeklyCredits: number;
  avatarUrl?: string;
  spotifyId?: string;
  isVerified?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Extracts and verifies the Supabase Auth JWT from the Authorization: Bearer header.
 * NEVER trusts any user ID, role, or x-user-id from the request body or custom headers.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing or malformed Authorization: Bearer token header.'
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Bearer token value is empty.' });
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(401).json({ error: 'Authentication service unavailable.' });
    }

    // Verify token strictly with Supabase Auth API - fail closed on any error
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        error: 'Authentication failed: ' + (error?.message || 'Invalid or expired authentication token.')
      });
    }

    const userId = data.user.id;
    const userEmail = data.user.email || null;
    const userMeta = data.user.user_metadata || {};

    // 3. Fetch verified user profile from Database
    let profile = await db.getUserProfile(userId);
    if (!profile) {
      // Create initial profile in database linked to auth.users ID
      const initialRole: 'artist' | 'curator' = userMeta.role === 'curator' ? 'curator' : 'artist';
      const initialName = userMeta.name || (userEmail ? userEmail.split('@')[0] : `Artist_${userId.slice(0, 5)}`);
      
      profile = await db.createProfile({
        id: userId,
        email: userEmail || `user_${userId.slice(0, 8)}@playlistplug.com`,
        name: initialName,
        role: initialRole,
        creditBalance: 0,
        freeWeeklyCredits: 2,
        avatarUrl: userMeta.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`
      });
    }

    // Attach verified user to request
    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      creditBalance: profile.creditBalance,
      freeWeeklyCredits: profile.freeWeeklyCredits,
      avatarUrl: profile.avatarUrl,
      spotifyId: profile.spotifyId,
      isVerified: profile.isVerified
    };

    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'Authentication failed: ' + (err.message || 'unknown error')
    });
  }
}

/**
 * Optional Auth: If Bearer token is provided, verify it. Otherwise proceed without req.user.
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return requireAuth(req, res, next);
}

/**
 * Enforces Admin Role. Must be preceded by requireAuth.
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
  }
  next();
}
