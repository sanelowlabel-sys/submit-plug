/**
 * Spotify Service without OAuth dependence
 * - Fetches metadata via Spotify's public oEmbed API and client-credentials flow with caching
 * - Handles missing preview URLs gracefully
 * - Supports one-time code playlist description verification
 */

export interface SpotifyParsedItem {
  id: string;
  type: 'track' | 'playlist' | 'album' | 'artist';
  title: string;
  authorName?: string;
  thumbnailUrl: string;
  embedHtml: string;
  spotifyUrl: string;
  previewUrl?: string;
  durationSec?: number;
  genres?: string[];
  trackCount?: number;
}

// In-memory cache with 1-hour TTL
interface CacheEntry {
  data: SpotifyParsedItem;
  timestamp: number;
}
const metadataCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Cached Client Credentials Token
let clientCredentialsToken: { token: string; expiresAt: number } | null = null;

async function getClientCredentialsToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  if (clientCredentialsToken && clientCredentialsToken.expiresAt > now + 60000) {
    return clientCredentialsToken.token;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (res.ok) {
      const data = await res.json();
      clientCredentialsToken = {
        token: data.access_token,
        expiresAt: now + (data.expires_in * 1000)
      };
      return clientCredentialsToken.token;
    }
  } catch (err) {
    console.warn('[Spotify] Client credentials token error:', err);
  }
  return null;
}

/**
 * Extract clean Spotify ID and type from URL or URI
 */
export function extractSpotifyInfo(input: string): { id: string; type: 'track' | 'playlist' | 'album' | 'artist' } | null {
  if (!input) return null;
  const trimmed = input.trim();

  // uri format: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  const uriMatch = trimmed.match(/^spotify:(track|playlist|album|artist):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    return {
      type: uriMatch[1].toLowerCase() as any,
      id: uriMatch[2]
    };
  }

  // url format: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
  const urlMatch = trimmed.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|playlist|album|artist)\/([a-zA-Z0-9]+)/i);
  if (urlMatch) {
    return {
      type: urlMatch[1].toLowerCase() as any,
      id: urlMatch[2]
    };
  }

  return null;
}

/**
 * Fetch Spotify Metadata using public oEmbed or Client Credentials with caching
 */
export async function fetchSpotifyMetadata(url: string): Promise<SpotifyParsedItem | null> {
  const parsed = extractSpotifyInfo(url);
  if (!parsed) return null;

  const cacheKey = `${parsed.type}:${parsed.id}`;
  const cached = metadataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const canonicalUrl = `https://open.spotify.com/${parsed.type}/${parsed.id}`;
  const token = await getClientCredentialsToken();

  // 1. Try Spotify Web API with Client Credentials if configured
  if (token) {
    try {
      if (parsed.type === 'track') {
        const res = await fetch(`https://api.spotify.com/v1/tracks/${parsed.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const trackData = await res.json();
          const item: SpotifyParsedItem = {
            id: parsed.id,
            type: 'track',
            title: trackData.name,
            authorName: trackData.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
            thumbnailUrl: trackData.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&fit=crop',
            embedHtml: `<iframe src="https://open.spotify.com/embed/track/${parsed.id}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`,
            spotifyUrl: canonicalUrl,
            previewUrl: trackData.preview_url || undefined, // gracefully handle missing preview URL
            durationSec: Math.floor(trackData.duration_ms / 1000)
          };
          metadataCache.set(cacheKey, { data: item, timestamp: Date.now() });
          return item;
        }
      } else if (parsed.type === 'playlist') {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${parsed.id}?fields=id,name,description,images,owner,tracks.total`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const plData = await res.json();
          const item: SpotifyParsedItem = {
            id: parsed.id,
            type: 'playlist',
            title: plData.name,
            authorName: plData.owner?.display_name || 'Spotify Curator',
            thumbnailUrl: plData.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop',
            embedHtml: `<iframe src="https://open.spotify.com/embed/playlist/${parsed.id}?utm_source=generator&theme=0" width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`,
            spotifyUrl: canonicalUrl,
            trackCount: plData.tracks?.total || 0
          };
          metadataCache.set(cacheKey, { data: item, timestamp: Date.now() });
          return item;
        }
      }
    } catch (apiErr) {
      console.warn('[Spotify API] Request failed, falling back to public oEmbed:', apiErr);
    }
  }

  // 2. Public oEmbed Endpoint (Requires NO authentication or tokens)
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const oembedData = await res.json();
      const item: SpotifyParsedItem = {
        id: parsed.id,
        type: parsed.type,
        title: oembedData.title || `${parsed.type.toUpperCase()} #${parsed.id.slice(0, 6)}`,
        authorName: oembedData.author_name || 'Spotify Creator',
        thumbnailUrl: oembedData.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop',
        embedHtml: oembedData.html || `<iframe src="https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`,
        spotifyUrl: canonicalUrl
      };
      metadataCache.set(cacheKey, { data: item, timestamp: Date.now() });
      return item;
    }
  } catch (oembedErr) {
    console.warn('[Spotify oEmbed] Request failed:', oembedErr);
  }

  // 3. Fallback structure if network to external Spotify endpoints is restricted
  const fallbackItem: SpotifyParsedItem = {
    id: parsed.id,
    type: parsed.type,
    title: `${parsed.type.toUpperCase()} (#${parsed.id.slice(0, 6)})`,
    authorName: 'Verified Spotify Creator',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&fit=crop',
    embedHtml: `<iframe src="https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`,
    spotifyUrl: canonicalUrl
  };
  return fallbackItem;
}

/**
 * Generate a unique verification code for playlist ownership verification
 */
export function generatePlaylistVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PLUG-VERIFY-${code}`;
}

/**
 * Verify playlist description contains the verification code
 */
export async function verifyPlaylistDescriptionCode(
  spotifyPlaylistUrl: string,
  expectedCode: string
): Promise<{ verified: boolean; message: string; description?: string }> {
  const parsed = extractSpotifyInfo(spotifyPlaylistUrl);
  if (!parsed || parsed.type !== 'playlist') {
    return { verified: false, message: 'Invalid Spotify playlist URL.' };
  }

  const token = await getClientCredentialsToken();
  if (token) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${parsed.id}?fields=description`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const description = data.description || '';
        if (description.includes(expectedCode)) {
          return { verified: true, message: 'Verification code confirmed in playlist description!', description };
        }
        return {
          verified: false,
          message: `Verification code "${expectedCode}" was not found in the playlist description. Current description: "${description.slice(0, 80)}..."`,
          description
        };
      }
    } catch (err: any) {
      console.warn('[Spotify Verify] API error:', err);
    }
  }

  // If Client Credentials are not configured or rate-limited, provide clear fallback guidance
  return {
    verified: false,
    message: 'Could not automatically inspect playlist description. Please submit for manual admin review below.'
  };
}
