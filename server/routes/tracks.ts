import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter } from '../middleware/rateLimit';

export const tracksRouter = Router();

tracksRouter.use(standardApiLimiter);

// In-memory catalog (empty by default, populated when artists add tracks)
const tracksCatalog: any[] = [];

// Get tracks
tracksRouter.get('/', (req: Request, res: Response) => {
  const { artist, genre } = req.query;
  let tracks = [...tracksCatalog];

  if (artist) {
    const artistStr = String(artist).toLowerCase();
    tracks = tracks.filter(t => (t.artist || '').toLowerCase().includes(artistStr));
  }

  if (genre && genre !== 'all') {
    const genreStr = String(genre).toLowerCase();
    tracks = tracks.filter(t => (t.genre || '').toLowerCase().includes(genreStr));
  }

  res.json({ tracks, count: tracks.length });
});

// Add new artist track
tracksRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    artist,
    albumArt,
    spotifyUrl,
    spotifyUri,
    previewUrl,
    durationSec,
    genre
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Track title is required' });
  }

  const newTrack = {
    id: `trk_${Date.now().toString(36)}`,
    title: String(title).trim(),
    artist: artist || req.user?.name || 'Independent Artist',
    albumArt: albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop',
    spotifyUrl: spotifyUrl || `https://open.spotify.com/track/${Date.now()}`,
    spotifyUri: spotifyUri || `spotify:track:${Date.now()}`,
    previewUrl: previewUrl || '',
    durationSec: durationSec ? Number(durationSec) : 180,
    genre: genre || 'Indie',
    releaseDate: new Date().toISOString().split('T')[0]
  };

  tracksCatalog.unshift(newTrack);

  res.status(201).json({ track: newTrack });
});
