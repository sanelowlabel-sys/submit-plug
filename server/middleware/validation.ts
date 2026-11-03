import { Request, Response, NextFunction } from 'express';

export type UserRole = 'artist' | 'curator' | 'admin';

/**
 * Validates Spotify URLs (Track, Playlist, Album, Artist)
 */
export function isValidSpotifyUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const urlPattern = /^https?:\/\/(?:open\.)?spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|playlist|album|artist)\/[a-zA-Z0-9]{20,24}(?:\?.*)?$/i;
  const uriPattern = /^spotify:(track|playlist|album|artist):[a-zA-Z0-9]{20,24}$/i;
  return urlPattern.test(trimmed) || uriPattern.test(trimmed);
}

/**
 * Validates Spotify Track URLs specifically
 */
export function isValidSpotifyTrackUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const urlPattern = /^https?:\/\/(?:open\.)?spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?track\/[a-zA-Z0-9]{20,24}(?:\?.*)?$/i;
  const uriPattern = /^spotify:track:[a-zA-Z0-9]{20,24}$/i;
  return urlPattern.test(trimmed) || uriPattern.test(trimmed);
}

/**
 * Validates Spotify Playlist URLs specifically
 */
export function isValidSpotifyPlaylistUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const urlPattern = /^https?:\/\/(?:open\.)?spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?playlist\/[a-zA-Z0-9]{20,24}(?:\?.*)?$/i;
  const uriPattern = /^spotify:playlist:[a-zA-Z0-9]{20,24}$/i;
  return urlPattern.test(trimmed) || uriPattern.test(trimmed);
}

/**
 * Basic string sanitization against XSS
 */
export function sanitizeText(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // remove HTML angle brackets
    .slice(0, maxLength);
}

/**
 * Input validator middleware for submission creation
 */
export function validateSubmissionInput(req: Request, res: Response, next: NextFunction) {
  const { playlistId, track, pitchType } = req.body;

  if (!playlistId || typeof playlistId !== 'string') {
    return res.status(400).json({ error: 'Valid playlistId is required.' });
  }

  if (!track || typeof track !== 'object') {
    return res.status(400).json({ error: 'Track metadata object is required.' });
  }

  if (!track.title || typeof track.title !== 'string') {
    return res.status(400).json({ error: 'Track title is required.' });
  }

  if (pitchType !== 'free' && pitchType !== 'premium') {
    return res.status(400).json({ error: 'Invalid pitchType: must be "free" or "premium".' });
  }

  if (track.spotifyUrl && !isValidSpotifyUrl(track.spotifyUrl)) {
    return res.status(400).json({ error: 'Provided track.spotifyUrl is not a valid Spotify URL format.' });
  }

  next();
}

/**
 * Input validator for playlist creation
 */
export function validatePlaylistInput(req: Request, res: Response, next: NextFunction) {
  const { title, spotifyUrl, pitchCostCredits } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return res.status(400).json({ error: 'Playlist title must be at least 2 characters long.' });
  }

  if (!spotifyUrl || !isValidSpotifyPlaylistUrl(spotifyUrl)) {
    return res.status(400).json({ error: 'A valid Spotify playlist URL is required (e.g. https://open.spotify.com/playlist/...)' });
  }

  if (pitchCostCredits !== undefined) {
    const cost = Number(pitchCostCredits);
    if (isNaN(cost) || cost < 1 || cost > 10) {
      return res.status(400).json({ error: 'pitchCostCredits must be an integer between 1 and 10.' });
    }
  }

  next();
}
