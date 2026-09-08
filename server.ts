import express, { Request, Response } from 'express';
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
import { realtime } from './server/websocket';
import { exchangeSpotifyCode, fetchSpotifyProfile } from './server/spotify';
import { db } from './server/db';

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Body parser middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize WebSockets
  realtime.init(server);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Submit Plug Real-Time Server',
      timestamp: new Date().toISOString(),
      activeWsClients: realtime.getActiveCount()
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

  // Spotify OAuth Callback handler (Popup Flow)
  app.get(['/auth/callback', '/auth/callback/'], async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const simulated = req.query.simulated === 'true';

    let userProfile: any = null;

    if (code && !simulated && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      try {
        const origin = req.headers.origin || (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `http://${req.headers.host}`);
        const redirectUri = `${origin}/auth/callback`;
        const tokenData = await exchangeSpotifyCode(code, redirectUri);
        if (tokenData.access_token) {
          const profile = await fetchSpotifyProfile(tokenData.access_token);
          if (state && db.getUserById(state)) {
            userProfile = db.updateUser(state, {
              spotifyId: profile.id,
              spotifyUri: profile.uri,
              spotifyFollowers: profile.followers?.total || 3400,
              avatarUrl: profile.images?.[0]?.url
            });
          }
        }
      } catch (err) {
        console.error('[OAuth Callback] Token exchange failed:', err);
      }
    } else if (state && db.getUserById(state)) {
      // Connect simulated Spotify profile for sandbox/testing
      userProfile = db.updateUser(state, {
        spotifyId: `spotify_${Math.random().toString(36).substring(2, 8)}`,
        spotifyFollowers: 4200,
        verifiedStatus: true
      });
    }

    // HTML response that sends postMessage to opener and closes popup cleanly
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Authentication</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background: #141414;
              color: white;
              text-align: center;
            }
            .spinner {
              border: 3px solid rgba(255,255,255,0.1);
              border-top: 3px solid #1DB954;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 16px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div>
            <div class="spinner"></div>
            <p>Spotify Connected! Closing window...</p>
          </div>
          <script>
            (function() {
              var payload = {
                type: 'OAUTH_AUTH_SUCCESS',
                provider: 'spotify',
                user: ${JSON.stringify(userProfile || {})},
                timestamp: Date.now()
              };
              if (window.opener) {
                window.opener.postMessage(payload, '*');
                setTimeout(function() { window.close(); }, 700);
              } else {
                window.location.href = '/';
              }
            })();
          </script>
        </body>
      </html>
    `);
  });

  // Vite middleware setup
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
    console.log(`[Submit Plug] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Submit Plug] Fatal startup error:', err);
});
