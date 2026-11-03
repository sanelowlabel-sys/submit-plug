import { Router, Request, Response } from 'express';

export const activityRouter = Router();

// Get live curator activity
activityRouter.get('/', (req: Request, res: Response) => {
  res.json({ activities: [] });
});
