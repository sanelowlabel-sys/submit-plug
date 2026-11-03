import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter, sensitiveActionLimiter } from '../middleware/rateLimit';
import { validatePlaylistInput } from '../middleware/validation';
import {
  fetchSpotifyMetadata,
  generatePlaylistVerificationCode,
  verifyPlaylistDescriptionCode
} from '../spotify';

export const playlistsRouter = Router();

playlistsRouter.use(standardApiLimiter);

/**
 * GET /api/playlists
 * Public view of live verified playlists.
 * If curator is authenticated, returns all their owned playlists (including unverified ones).
 */
playlistsRouter.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { genre, search, curatorId } = req.query;

    // If filtering by specific curator, or if the requester is requesting their own
    const targetCuratorId = curatorId ? String(curatorId) : undefined;
    const isOwnerRequest = req.user && targetCuratorId && req.user.id === targetCuratorId;

    const playlists = await db.getPlaylists({
      genre: genre ? String(genre) : undefined,
      search: search ? String(search) : undefined,
      curatorId: targetCuratorId,
      // Public can only see live verified playlists, unless curator is inspecting their own
      onlyActive: !isOwnerRequest && req.user?.role !== 'admin'
    });

    res.json({ playlists, total: playlists.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch playlists' });
  }
});

/**
 * GET /api/playlists/:id
 * Fetch single playlist details
 */
playlistsRouter.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const playlist = await db.getPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }

    // Non-owner and non-admin can only view active verified playlists
    if (!playlist.isActive && playlist.curatorId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(404).json({ error: 'Playlist is currently not active.' });
    }

    res.json({ playlist });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch playlist' });
  }
});

/**
 * POST /api/playlists
 * Onboard a new Spotify playlist.
 * Generates a one-time verification code for description verification.
 * NO simulated-verified path. Curator ID is strictly from verified JWT token.
 */
playlistsRouter.post('/', requireAuth, sensitiveActionLimiter, validatePlaylistInput, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const {
    title,
    description,
    spotifyUrl,
    genres,
    pitchCostCredits,
    freePitchEnabled,
    spotlightTrack
  } = req.body;

  // 1. Fetch metadata from Spotify (Reject if metadata cannot be fetched)
  const meta = await fetchSpotifyMetadata(spotifyUrl);
  if (!meta) {
    return res.status(400).json({
      error: 'Unable to fetch Spotify playlist metadata. Please verify that the Spotify playlist URL is public and valid.'
    });
  }

  const coverArt = meta.thumbnailUrl;
  if (!coverArt) {
    return res.status(400).json({
      error: 'Could not retrieve playlist artwork from Spotify. Please check the playlist URL.'
    });
  }

  const trackCount = meta.trackCount || 0;

  // 2. Generate unique one-time verification code
  const verificationCode = generatePlaylistVerificationCode();

  // 3. Create playlist record linked to verified curator JWT user ID
  const newPlaylist = await db.createPlaylist({
    title: (meta.title || title).trim(),
    description: (description || '').trim(),
    curatorId: req.user.id, // Strictly from verified JWT!
    curatorName: req.user.name,
    curatorAvatar: req.user.avatarUrl,
    coverArt,
    spotifyUrl,
    spotifyUri: meta.id ? `spotify:playlist:${meta.id}` : `spotify:playlist:${req.user.id}`,
    followerCount: 0,
    trackCount,
    genres: Array.isArray(genres) && genres.length > 0 ? genres : ['Indie', 'Alternative'],
    pitchCostCredits: pitchCostCredits ? Math.max(1, Math.min(10, Number(pitchCostCredits))) : 1,
    freePitchEnabled: freePitchEnabled !== undefined ? Boolean(freePitchEnabled) : true,
    avgResponseHours: 24,
    approvalRate: null, // New playlist without reviews yet
    isActive: false, // Inactive until verified
    isVerified: false,
    verificationCode,
    verificationStatus: 'pending',
    spotlightTrack: spotlightTrack || undefined
  });

  res.status(201).json({
    playlist: newPlaylist,
    verificationCode,
    instruction: `Please paste the code "${verificationCode}" anywhere into your Spotify playlist description to confirm ownership, or submit for manual admin review.`
  });
});

/**
 * POST /api/playlists/:id/verify-code
 * Checks Spotify playlist description for the one-time verification code
 */
playlistsRouter.post('/:id/verify-code', requireAuth, sensitiveActionLimiter, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const playlist = await db.getPlaylistById(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found.' });
  }

  // Only the playlist owner or admin can trigger verification
  if (playlist.curatorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: only the playlist owner can verify ownership.' });
  }

  if (!playlist.verificationCode) {
    return res.status(400).json({ error: 'No verification code assigned to this playlist.' });
  }

  const result = await verifyPlaylistDescriptionCode(playlist.spotifyUrl, playlist.verificationCode);

  if (result.verified) {
    const updated = await db.updatePlaylist(playlist.id, {
      isVerified: true,
      isActive: true,
      verificationStatus: 'verified'
    });
    return res.json({
      success: true,
      verified: true,
      message: 'Playlist ownership verified! Your playlist is now active and listed on Playlist Plug.',
      playlist: updated
    });
  }

  res.json({
    success: false,
    verified: false,
    message: result.message,
    fallbackOption: 'You can submit this playlist for manual admin review if Spotify description updates are delayed.'
  });
});

/**
 * POST /api/playlists/:id/request-admin-review
 * Manual admin approval fallback if Spotify description update is delayed
 */
playlistsRouter.post('/:id/request-admin-review', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const playlist = await db.getPlaylistById(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found.' });
  }

  if (playlist.curatorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: only playlist owner can request review.' });
  }

  const updated = await db.updatePlaylist(playlist.id, {
    verificationStatus: 'pending'
  });

  res.json({
    success: true,
    message: 'Playlist has been submitted for manual admin review. An admin will inspect and approve shortly.',
    playlist: updated
  });
});

/**
 * PATCH /api/playlists/:id/toggle-status
 * Curator pauses or activates their verified playlist
 */
playlistsRouter.patch('/:id/toggle-status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const playlist = await db.getPlaylistById(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found.' });
  }

  if (playlist.curatorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: only the playlist owner can toggle status.' });
  }

  const updated = await db.updatePlaylist(playlist.id, {
    isActive: !playlist.isActive
  });

  res.json({ success: true, playlist: updated });
});
