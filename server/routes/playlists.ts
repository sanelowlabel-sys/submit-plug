import { Router, Request, Response } from 'express';
import { db } from '../db';
import { realtime } from '../websocket';
import { extractSpotifyId } from '../spotify';

export const playlistsRouter = Router();

// Get all playlists with filtering
playlistsRouter.get('/', (req: Request, res: Response) => {
  const { genre, search, curatorId, featured } = req.query;
  let list = db.getPlaylists();

  if (genre && genre !== 'all' && genre !== 'All Genres') {
    list = list.filter((p) =>
      p.genres.some((g) => g.toLowerCase().includes(String(genre).toLowerCase()))
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.curatorName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.genres.some((g) => g.toLowerCase().includes(q))
    );
  }

  if (curatorId) {
    list = list.filter((p) => p.curatorId === curatorId);
  }

  if (featured === 'true') {
    list = list.filter((p) => p.isFeatured);
  }

  res.json({ playlists: list, total: list.length });
});

// Get playlist by ID
playlistsRouter.get('/:id', (req: Request, res: Response) => {
  const playlist = db.getPlaylistById(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  res.json({ playlist });
});

// Create new playlist (curator onboarding)
playlistsRouter.post('/', (req: Request, res: Response) => {
  const {
    title,
    description,
    curatorId,
    curatorName,
    curatorAvatar,
    curatorSpotifyId,
    coverArt,
    spotifyUrl,
    followerCount,
    trackCount,
    genres,
    pitchCostCredits,
    freePitchEnabled,
    gates
  } = req.body;

  if (!title || !spotifyUrl) {
    return res.status(400).json({ error: 'Title and Spotify playlist URL are required' });
  }

  const spotifyId = extractSpotifyId(spotifyUrl, 'playlist') || `spotify_pl_${Date.now()}`;

  const created = db.createPlaylist({
    title,
    description: description || 'Curated independent music playlist.',
    curatorId: curatorId || 'usr_curator_1',
    curatorName: curatorName || 'Verified Curator',
    curatorAvatar: curatorAvatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    curatorSpotifyId: curatorSpotifyId || 'curator_spotify',
    coverArt: coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    spotifyUrl,
    spotifyUri: `spotify:playlist:${spotifyId}`,
    followerCount: followerCount ? Number(followerCount) : Math.floor(Math.random() * 20000) + 5000,
    trackCount: trackCount ? Number(trackCount) : 65,
    genres: Array.isArray(genres) && genres.length > 0 ? genres : ['Indie', 'Alternative'],
    approvalRate: 15,
    avgResponseHours: 24,
    pitchCostCredits: pitchCostCredits !== undefined ? Number(pitchCostCredits) : 1,
    freePitchEnabled: freePitchEnabled !== undefined ? Boolean(freePitchEnabled) : true,
    isVerified: true,
    isFeatured: false,
    acceptingSubmissions: true,
    lastActiveAt: 'Just now',
    gates: gates || {
      requireCuratorFollow: true,
      requirePlaylistFollow: true,
      requireSongSave: false,
      curatorSpotifyProfileUrl: `https://open.spotify.com/user/${curatorSpotifyId || 'curator_spotify'}`
    }
  });

  realtime.broadcast('PLAYLIST_CREATED', created);

  res.status(201).json({ playlist: created });
});

// Update playlist
playlistsRouter.patch('/:id', (req: Request, res: Response) => {
  const updated = db.updatePlaylist(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  realtime.broadcast('PLAYLIST_UPDATED', updated);
  res.json({ playlist: updated });
});

// Spotify oEmbed playlist metadata lookup
playlistsRouter.post('/spotify-lookup', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        title: data.title || 'Spotify Playlist',
        thumbnailUrl: data.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        authorName: data.author_name || 'Spotify Curator',
        html: data.html
      });
    }

    // Fallback extraction
    const playlistId = extractSpotifyId(url, 'playlist');
    res.json({
      success: true,
      title: 'Imported Spotify Playlist',
      playlistId,
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});
