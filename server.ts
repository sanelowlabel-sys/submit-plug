import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/auth';
import { playlistsRouter } from './server/routes/playlists';
import { submissionsRouter } from './server/routes/submissions';
import { walletRouter } from './server/routes/wallet';
import { paymentsRouter } from './server/routes/payments';
import { activityRouter } from './server/routes/activity';
import { emailsRouter } from './server/routes/emails';
import { supabaseRouter } from './server/routes/supabase';
import { spotifyRouter } from './server/routes/spotify';
import { tracksRouter } from './server/routes/tracks';
import { adminRouter } from './server/routes/admin';
import { reportsRouter } from './server/routes/reports';
import { logsRouter } from './server/routes/logs';
import { supabaseServerRouter } from './server/supabaseServer';
import { startScheduler } from './server/scheduler';

dotenv.config();

// Exit at startup if SUPABASE_SERVICE_ROLE_KEY, PAYPAL_WEBHOOK_ID, or the PayPal credentials are missing
const requiredStartupVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYPAL_WEBHOOK_ID',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET'
];

const missingStartupVars = requiredStartupVars.filter(
  (v) => !process.env[v] || process.env[v]?.trim() === ''
);

if (missingStartupVars.length > 0) {
  console.error(
    `[FATAL STARTUP ERROR] Missing required environment variables: ${missingStartupVars.join(', ')}`
  );
  process.exit(1);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  const server = http.createServer(app);
  // Phase 2: Use process.env.PORT
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser middlewares
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Supabase PostgREST & Auth Engine (/auth/v1/* and /rest/v1/*)
  app.use(supabaseServerRouter);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Playlist Plug API Server',
      database: 'Supabase PostgreSQL',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/playlists', playlistsRouter);
  app.use('/api/submissions', submissionsRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/activity', activityRouter);
  app.use('/api/emails', emailsRouter);
  app.use('/api/supabase', supabaseRouter);
  app.use('/api/spotify', spotifyRouter);
  app.use('/api/tracks', tracksRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/logs', logsRouter);

  // Phase 6: Global Express error monitoring middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Unhandled Server Error]', {
      method: req.method,
      path: req.path,
      error: err?.message || String(err),
      timestamp: new Date().toISOString()
    });
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : (err.message || 'Server error')
    });
  });

  // Vite middleware setup (SPA mode in development, static in production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Playlist Plug] Server running at http://0.0.0.0:${PORT}`);
    startScheduler();
  });
}

startServer().catch((err) => {
  console.error('[Playlist Plug] Fatal startup error:', err);
});
