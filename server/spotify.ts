export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email?: string;
  images?: Array<{ url: string }>;
  followers?: { total: number };
  uri: string;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  tracks: { total: number };
  external_urls: { spotify: string };
  uri: string;
}

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-follow-modify',
  'user-follow-read'
].join(' ');

export function getSpotifyAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    show_dialog: 'true',
    ...(state ? { state } : {})
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeSpotifyCode(code: string, redirectUri: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET) are not configured in environment variables.');
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    }).toString()
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Spotify token exchange failed (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function fetchSpotifyProfile(accessToken: string): Promise<SpotifyUserProfile> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Spotify profile: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchSpotifyUserPlaylists(accessToken: string): Promise<SpotifyPlaylistSummary[]> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user playlists: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Extract clean Spotify ID from standard URLs or URIs
export function extractSpotifyId(input: string, type: 'playlist' | 'track' | 'user'): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // uri format: spotify:playlist:37i9dQZF1DXdLEN7aqioXM
  if (trimmed.startsWith(`spotify:${type}:`)) {
    return trimmed.split(':')[2] || null;
  }

  // url format: https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM?si=...
  const urlMatch = trimmed.match(new RegExp(`open\\.spotify\\.com\\/${type}\\/([a-zA-Z0-9]+)`));
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Raw ID check (alphanumeric 22 chars typically)
  if (/^[a-zA-Z0-9]{20,24}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
