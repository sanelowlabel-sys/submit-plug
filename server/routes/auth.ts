import { Router, Request, Response } from 'express';
import { db } from '../db';
import { getSpotifyAuthUrl, exchangeSpotifyCode, fetchSpotifyProfile, fetchSpotifyUserPlaylists } from '../spotify';
import { realtime } from '../websocket';

export const authRouter = Router();

// Register user
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const newUser = db.createUser({
    name,
    email,
    password,
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
    role: role || 'artist',
    bio: role === 'curator' ? 'Verified playlist curator on Spotify' : 'Independent music producer',
    creditBalance: 10,
    verifiedStatus: role === 'curator' ? false : true
  });

  res.json({ user: newUser, token: `token_${newUser.id}` });
});

// Login user
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    // If user doesn't exist, create an account dynamically
    user = db.createUser({
      name: email.split('@')[0],
      email,
      password,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      role: 'artist',
      bio: 'Independent artist on Submit Plug',
      creditBalance: 10,
      verifiedStatus: true
    });
  }

  res.json({ user, token: `token_${user.id}` });
});

// Get current authenticated user
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers['x-user-id'] as string;

  let user = userIdHeader ? db.getUserById(userIdHeader) : undefined;

  if (!user && authHeader && authHeader.startsWith('Bearer token_')) {
    const userId = authHeader.replace('Bearer token_', '');
    user = db.getUserById(userId);
  }

  // Fallback to first user in database
  if (!user) {
    user = db.getUsers()[0];
  }

  // Check weekly reset on fetch
  db.checkWeeklyCreditsReset();

  res.json({ user });
});

// Update profile
authRouter.post('/update-profile', (req: Request, res: Response) => {
  const { id, name, bio, avatarUrl, role, spotifyId, spotifyUri } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const updated = db.updateUser(id, {
    ...(name ? { name } : {}),
    ...(bio ? { bio } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(role ? { role } : {}),
    ...(spotifyId ? { spotifyId } : {}),
    ...(spotifyUri ? { spotifyUri } : {})
  });

  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  realtime.broadcast('USER_UPDATED', updated);

  res.json({ user: updated });
});

// Spotify OAuth URL generator
authRouter.get('/spotify/url', (req: Request, res: Response) => {
  const origin = req.headers.origin || (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `http://${req.headers.host}`);
  const redirectUri = `${origin}/auth/callback`;
  const state = (req.query.userId as string) || '';

  if (!process.env.SPOTIFY_CLIENT_ID) {
    // If Spotify Client ID is not configured yet, provide simulated authorization URL
    return res.json({
      configured: false,
      url: `/auth/callback?simulated=true&state=${state}&code=simulated_code_${Date.now()}`,
      redirectUri,
      message: 'SPOTIFY_CLIENT_ID is not configured. Falling back to sandbox Spotify sync.'
    });
  }

  const url = getSpotifyAuthUrl(redirectUri, state);
  res.json({
    configured: true,
    url,
    redirectUri
  });
});

// Spotify manual sync with token
authRouter.post('/spotify/sync', async (req: Request, res: Response) => {
  const { userId, accessToken } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    if (accessToken) {
      const profile = await fetchSpotifyProfile(accessToken);
      const playlists = await fetchSpotifyUserPlaylists(accessToken);

      const updated = db.updateUser(userId, {
        spotifyId: profile.id,
        spotifyUri: profile.uri,
        spotifyFollowers: profile.followers?.total || user.spotifyFollowers || 1200,
        avatarUrl: profile.images?.[0]?.url || user.avatarUrl
      });

      return res.json({ user: updated, playlistsCount: playlists.length, playlists });
    }

    // Default sync verification
    const updated = db.updateUser(userId, {
      spotifyId: user.spotifyId || `${user.name.toLowerCase().replace(/\s+/g, '_')}_spotify`,
      spotifyFollowers: user.spotifyFollowers || 5400
    });

    res.json({ user: updated, synced: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});
