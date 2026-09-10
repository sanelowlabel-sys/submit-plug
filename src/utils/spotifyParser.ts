import { SpotifyParsedMetadata, SpotifyItemType, Track } from '../types';

/**
 * Checks whether an input string is a valid Spotify URL, URI, or ID
 */
export function isSpotifyUrl(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  return (
    trimmed.startsWith('spotify:') ||
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|playlist|album|artist)\//i.test(trimmed) ||
    /^[a-zA-Z0-9]{22}$/.test(trimmed)
  );
}

/**
 * Parses a Spotify URL, URI, or raw ID into structured identifiers
 */
export function parseSpotifyUrl(input: string): {
  type: SpotifyItemType;
  id: string;
  embedUrl: string;
  canonicalUrl: string;
  uri: string;
} | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Spotify URI format: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  const uriMatch = trimmed.match(/^spotify:(track|playlist|album|artist):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    const type = uriMatch[1].toLowerCase() as SpotifyItemType;
    const id = uriMatch[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
      uri: `spotify:${type}:${id}`
    };
  }

  // 2. Spotify URL (including international / embed variants)
  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|playlist|album|artist)\/([a-zA-Z0-9]+)/i
  );
  if (urlMatch) {
    const type = urlMatch[1].toLowerCase() as SpotifyItemType;
    const id = urlMatch[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
      uri: `spotify:${type}:${id}`
    };
  }

  // 3. Raw 22-char base62 ID - default to track
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return {
      type: 'track',
      id: trimmed,
      embedUrl: `https://open.spotify.com/embed/track/${trimmed}?utm_source=generator&theme=0`,
      canonicalUrl: `https://open.spotify.com/track/${trimmed}`,
      uri: `spotify:track:${trimmed}`
    };
  }

  return null;
}

/**
 * Fetches complete track/playlist/album metadata from our backend Spotify oEmbed service
 */
export async function fetchSpotifyMetadata(inputUrlOrUri: string): Promise<SpotifyParsedMetadata | null> {
  const parsed = parseSpotifyUrl(inputUrlOrUri);
  if (!parsed) return null;

  try {
    const res = await fetch(`/api/spotify/metadata?url=${encodeURIComponent(parsed.canonicalUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.metadata) {
        return data.metadata;
      }
    }
  } catch (err) {
    console.warn('[spotifyParser] Server metadata fetch error, falling back to local heuristic:', err);
  }

  // Fallback client-side generation
  return {
    id: parsed.id,
    type: parsed.type,
    title: parsed.type === 'track' ? `Spotify Track (${parsed.id.slice(0, 6)})` : `Spotify ${parsed.type.toUpperCase()}`,
    artist: 'Verified Spotify Creator',
    creatorName: 'Verified Curator',
    coverArt:
      parsed.type === 'track'
        ? 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    spotifyUrl: parsed.canonicalUrl,
    spotifyUri: parsed.uri,
    embedUrl: parsed.embedUrl,
    durationSec: 180,
    durationFormatted: '3:00',
    releaseYear: new Date().getFullYear().toString()
  };
}

/**
 * Converts a parsed Spotify metadata object into a playable App Track
 */
export function convertSpotifyMetadataToTrack(metadata: SpotifyParsedMetadata): Track {
  return {
    id: `spot_${metadata.id}`,
    title: metadata.title,
    artist: metadata.artist,
    albumArt: metadata.coverArt,
    spotifyUrl: metadata.spotifyUrl,
    spotifyUri: metadata.spotifyUri,
    previewUrl: metadata.previewUrl || '',
    durationSec: metadata.durationSec || 180,
    genre: metadata.genres?.[0] || (metadata.type === 'playlist' ? 'Curated Playlist' : 'Spotify Release'),
    releaseDate: metadata.releaseDate || metadata.releaseYear || '2024'
  };
}
