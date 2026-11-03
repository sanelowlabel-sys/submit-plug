import { Router, Request, Response } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter } from '../middleware/rateLimit';

export const logsRouter = Router();

logsRouter.use(standardApiLimiter);

/**
 * POST /api/logs/error
 * Client error monitoring endpoint
 */
logsRouter.post('/error', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { message, stack, componentStack, url } = req.body;
  const userContext = req.user ? `[User: ${req.user.id} (${req.user.role})]` : '[Guest]';

  console.error(`[Client Error Monitoring] ${userContext} at ${url || 'unknown page'}:`, {
    message,
    componentStack: componentStack?.slice(0, 300),
    timestamp: new Date().toISOString()
  });

  res.json({ recorded: true });
});
