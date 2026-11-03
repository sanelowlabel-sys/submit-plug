import { Router, Request, Response } from 'express';
import { standardApiLimiter } from '../middleware/rateLimit';
import { isValidSpotifyUrl } from '../middleware/validation';
import { fetchSpotifyMetadata, extractSpotifyInfo } from '../spotify';

export const spotifyRouter = Router();

spotifyRouter.use(standardApiLimiter);

/**
 * POST /api/spotify/resolve
 * Resolve Spotify URL to metadata (title, artist, cover art, embedHtml, previewUrl)
 */
spotifyRouter.post('/resolve', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url || !isValidSpotifyUrl(url)) {
    return res.status(400).json({ error: 'Please enter a valid Spotify track, album, or playlist URL.' });
  }

  try {
    const meta = await fetchSpotifyMetadata(url);
    if (!meta) {
      return res.status(404).json({ error: 'Could not extract metadata from the provided Spotify URL.' });
    }

    res.json({
      success: true,
      data: meta
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve Spotify URL: ' + (err.message || 'unknown error') });
  }
});
