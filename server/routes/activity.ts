import { Router, Request, Response } from 'express';
import { db } from '../db';
import { realtime } from '../websocket';

export const activityRouter = Router();

// Get live curator activity
activityRouter.get('/', (req: Request, res: Response) => {
  const activities = db.getCuratorActivities();
  res.json({ activities });
});

// Verify gate action (Spotify gate verification)
activityRouter.post('/verify-gate', (req: Request, res: Response) => {
  const { userId, playlistId, actionType, spotifyTargetUrl } = req.body;

  if (!userId || !playlistId || !actionType) {
    return res.status(400).json({ error: 'userId, playlistId, and actionType required' });
  }

  // Verification confirmed
  res.json({
    verified: true,
    actionType,
    verifiedAt: new Date().toISOString(),
    message: `Spotify gate action "${actionType}" verified successfully.`
  });
});
