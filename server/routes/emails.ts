import { Router, Request, Response } from 'express';
import { db } from '../db';

export const emailsRouter = Router();

// Get dispatched email logs
emailsRouter.get('/', (req: Request, res: Response) => {
  const { recipientRole, to } = req.query;
  let list = db.getEmails();

  if (recipientRole) {
    list = list.filter((e) => e.recipientRole === recipientRole);
  }
  if (to) {
    list = list.filter((e) => e.to.toLowerCase() === String(to).toLowerCase());
  }

  res.json({ emails: list, count: list.length });
});

// Get specific email HTML
emailsRouter.get('/:id', (req: Request, res: Response) => {
  const email = db.getEmails().find((e) => e.id === req.params.id);
  if (!email) {
    return res.status(404).json({ error: 'Email log not found' });
  }
  res.json({ email });
});
