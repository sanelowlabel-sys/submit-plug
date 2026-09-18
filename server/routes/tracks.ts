import { Router, Request, Response } from 'express';
import { db } from '../db';
import { realtime } from '../websocket';

export const tracksRouter = Router();

// Get all tracks or filter by artist
tracksRouter.get('/', (req: Request, res: Response) => {
  const { artist, genre } = req.query;
  let tracks = db.getTracks();

  if (artist) {
    const artistStr = String(artist).toLowerCase();
    tracks = tracks.filter(t => t.artist.toLowerCase().includes(artistStr));
  }

  if (genre && genre !== 'all') {
    const genreStr = String(genre).toLowerCase();
    tracks = tracks.filter(t => t.genre.toLowerCase().includes(genreStr));
  }

  res.json({ tracks, count: tracks.length });
});

// Add new artist track
tracksRouter.post('/', (req: Request, res: Response) => {
  const {
    title,
    artist,
    albumArt,
    spotifyUrl,
    spotifyUri,
    previewUrl,
    durationSec,
    genre,
    bpm,
    key,
    releaseDate
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Track title is required' });
  }

  const newTrack = db.addTrack({
    title,
    artist: artist || 'Independent Artist',
    albumArt: albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    spotifyUrl: spotifyUrl || `https://open.spotify.com/track/${Date.now()}`,
    spotifyUri: spotifyUri || `spotify:track:${Date.now()}`,
    previewUrl: previewUrl || '',
    durationSec: durationSec ? Number(durationSec) : 180,
    genre: genre || 'Indie',
    bpm: bpm ? Number(bpm) : 120,
    key: key || 'C Major',
    releaseDate: releaseDate || new Date().toISOString().split('T')[0],
    playCount: Math.floor(Math.random() * 5000) + 500
  });

  realtime.broadcast('TRACK_ADDED', newTrack);

  res.status(201).json({ success: true, track: newTrack });
});
