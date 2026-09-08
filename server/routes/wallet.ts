import { Router, Request, Response } from 'express';
import { db } from '../db';
import { realtime } from '../websocket';

export const walletRouter = Router();

walletRouter.get('/', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

  db.checkWeeklyCreditsReset();

  const user = userId ? db.getUserById(userId) : db.getUsers()[0];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const transactions = db.getTransactions(user.id);

  // Compute next weekly reset date (7 days after lastWeeklyReset)
  const lastReset = user.lastWeeklyReset ? new Date(user.lastWeeklyReset) : new Date();
  const nextReset = new Date(lastReset.getTime() + 7 * 24 * 60 * 60 * 1000);

  res.json({
    userId: user.id,
    creditBalance: user.creditBalance || 0,
    freeWeeklyCredits: user.freeWeeklyCredits || 0,
    lastWeeklyReset: user.lastWeeklyReset,
    nextWeeklyReset: nextReset.toISOString(),
    transactions
  });
});

walletRouter.get('/transactions', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const transactions = db.getTransactions(userId);
  res.json({ transactions });
});
