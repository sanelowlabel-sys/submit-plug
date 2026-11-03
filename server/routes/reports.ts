import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { reportsLimiter } from '../middleware/rateLimit';
import { sanitizeText } from '../middleware/validation';

export const reportsRouter = Router();

reportsRouter.use(reportsLimiter);

/**
 * POST /api/reports
 * Submit abuse / moderation report for a playlist, track, or curator
 */
reportsRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { targetType, targetId, targetTitle, reason, details } = req.body;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ error: 'targetType, targetId, and reason are required.' });
  }

  const validTypes = ['playlist', 'submission', 'user', 'track'];
  if (!validTypes.includes(targetType)) {
    return res.status(400).json({ error: 'Invalid targetType.' });
  }

  const report = await db.createReport({
    reporterId: req.user.id,
    reporterEmail: req.user.email,
    targetType,
    targetId: String(targetId).trim(),
    targetTitle: sanitizeText(targetTitle, 150),
    reason: sanitizeText(reason, 100),
    details: sanitizeText(details, 1000)
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for reporting. Our moderation team has logged this report and will inspect it shortly.',
    reportId: report.id
  });
});
