import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter } from '../middleware/rateLimit';

export const authRouter = Router();

// Apply rate limiting
authRouter.use(standardApiLimiter);

/**
 * GET /api/auth/me
 * Retrieves current user profile strictly from verified Supabase JWT Bearer token.
 * Never trusts user IDs or roles from body or unverified headers.
 */
authRouter.get('/me', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  try {
    const profile = await db.getUserProfile(req.user.id);
    res.json({ user: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
  }
});

/**
 * POST /api/auth/update-profile
 * Updates user profile fields (name, bio, avatarUrl, spotifyId).
 * Enforces security rule: USERS CANNOT CHANGE THEIR OWN ROLE OR CREDIT BALANCE.
 */
authRouter.post('/update-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { name, bio, avatarUrl, spotifyId, spotifyUri } = req.body;

  // db.updateUserProfile explicitly strips any role or credit balance modifications
  const updated = await db.updateUserProfile(req.user.id, {
    name,
    bio,
    avatarUrl,
    spotifyId,
    spotifyUri
  });

  if (!updated) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  res.json({ user: updated, message: 'Profile updated successfully' });
});

/**
 * DELETE /api/auth/delete-account
 * Phase 6: Account deletion flow
 * Deletes user profile, related records, and cleans up database presence.
 */
authRouter.delete('/delete-account', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await db.deleteUserAccount(req.user.id);
    res.json({ success: true, message: 'Account and associated data deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete account: ' + (err.message || 'unknown') });
  }
});
