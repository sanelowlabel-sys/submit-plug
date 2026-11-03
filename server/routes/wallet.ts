import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter } from '../middleware/rateLimit';

export const walletRouter = Router();

walletRouter.use(standardApiLimiter);

/**
 * GET /api/wallet
 * Returns current user's balance and ledger transactions.
 * Strictly uses req.user.id from verified JWT token.
 */
walletRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const profile = await db.getUserProfile(req.user.id);
    const transactions = await db.getTransactionsForUser(req.user.id);

    res.json({
      creditBalance: profile?.creditBalance || 0,
      freeWeeklyCredits: profile?.freeWeeklyCredits ?? 2,
      transactions
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch wallet' });
  }
});
