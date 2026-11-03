import { Router, Request, Response } from 'express';
import { db } from '../db';

export const emailsRouter = Router();

// Get dispatched email logs
emailsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { recipient, to } = req.query;
    let list = await db.getEmails();

    const target = recipient || to;
    if (target) {
      list = list.filter((e) => e.recipient.toLowerCase() === String(target).toLowerCase());
    }

    res.json({ emails: list, count: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch email logs' });
  }
});

// Get specific email HTML
emailsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const emails = await db.getEmails();
    const email = emails.find((e) => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email log not found' });
    }
    res.json({ email });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch email log' });
  }
});
