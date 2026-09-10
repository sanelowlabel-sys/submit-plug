export type UserRole = 'artist' | 'curator' | 'admin';

export interface CuratorGatesConfig {
  requireCuratorFollow: boolean;
  requirePlaylistFollow: boolean;
  requireSongSave: boolean;
  curatorSpotifyProfileUrl?: string;
  targetSongSpotifyUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  spotifyId?: string;
  spotifyUri?: string;
  spotifyFollowers?: number;
  bio: string;
  creditBalance: number; // premium credits
  freeWeeklyCredits: number; // free weekly allowance
  lastWeeklyReset?: string;
  earningsBalance?: number; // legacy (curators do not receive cash payouts)
  verifiedStatus: boolean;
  totalSubmissions: number;
  totalPlacements: number;
  createdAt: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  spotifyUrl: string;
  spotifyUri: string;
  previewUrl: string; // audio sample url
  durationSec: number;
  genre: string;
  bpm?: number;
  key?: string;
  releaseDate: string;
  artistSpotifyId?: string;
  playCount?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  curatorId: string;
  curatorName: string;
  curatorAvatar: string;
  curatorSpotifyId: string;
  coverArt: string;
  spotifyUrl: string;
  spotifyUri: string;
  followerCount: number;
  trackCount: number;
  genres: string[];
  approvalRate: number; // e.g. 14%
  avgResponseHours: number; // e.g. 18 hours
  pitchCostCredits: number; // e.g. 1 or 2 credits
  freePitchEnabled: boolean;
  spotlightTrack?: Track; // track required for free pitch listen
  isVerified: boolean;
  isFeatured?: boolean;
  acceptingSubmissions: boolean;
  recentAddedTracks?: Track[];
  gates?: CuratorGatesConfig;
  lastActiveAt?: string;
}

export type PitchType = 'free' | 'premium';
export type SubmissionStatus = 'pending' | 'approved' | 'declined' | 'added_to_playlist';

export interface Submission {
  id: string;
  track: Track;
  playlistId: string;
  playlistTitle: string;
  playlistCover: string;
  curatorId: string;
  curatorName: string;
  artistId: string;
  artistName: string;
  artistAvatar: string;
  pitchType: PitchType;
  pitchCost: number; // 0 for free, 1-3 for premium
  customMessage?: string;
  status: SubmissionStatus;
  feedbackTags: string[];
  feedbackNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  spotlightListenedDuration?: number;
  spotifyPlacementUrl?: string;
  gateActionsCompleted?: {
    followedCurator?: boolean;
    followedPlaylist?: boolean;
    savedSong?: boolean;
  };
}

export interface CreditTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number; // positive or negative
  type: 'purchase' | 'free_pitch' | 'premium_pitch' | 'weekly_credit_reset' | 'curator_gate_reward' | 'admin_bonus';
  description: string;
  createdAt: string;
  status: 'completed' | 'pending';
  paypalAmountUsd?: number;
  paypalOrderId?: string;
  paypalPayerEmail?: string;
}

export interface SupabaseStatusInfo {
  projectUrl: string;
  connected: boolean;
  isConfigured: boolean;
  tables: {
    name: string;
    description: string;
    syncedCount: number;
    lastSyncedAt?: string;
  }[];
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: 'new_submission_curator' | 'submission_approved_artist' | 'submission_declined_artist';
  recipientRole: 'artist' | 'curator';
  trackTitle: string;
  playlistTitle: string;
  curatorName: string;
  artistName: string;
  html: string;
  status: 'sent' | 'delivered';
  sentAt: string;
}

export interface CuratorActivityEvent {
  id: string;
  curatorId: string;
  curatorName: string;
  curatorAvatar: string;
  action: 'reviewed' | 'approved' | 'declined' | 'added_playlist' | 'came_online';
  playlistTitle: string;
  trackTitle?: string;
  timestamp: string;
  approvalRate?: number;
  avgResponseHours?: number;
}

export interface CuratorVerificationApplication {
  id: string;
  curatorId: string;
  curatorName: string;
  curatorEmail: string;
  curatorAvatar: string;
  playlistCount: number;
  totalFollowers: number;
  topGenres: string[];
  spotifyProfileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewNotes?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'placement_success' | 'pitch_declined' | 'credits_added' | 'new_submission' | 'curator_verified' | 'gate_reward';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  popular?: boolean;
  discountBadge?: string;
  features: string[];
}

export type ActiveTab = 'home' | 'marketplace' | 'artist' | 'curator' | 'profile' | 'emails' | 'dashboard';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
  durationMs?: number;
}

export type SpotifyItemType = 'track' | 'playlist' | 'album' | 'artist';

export interface SpotifyParsedMetadata {
  id: string;
  type: SpotifyItemType;
  title: string;
  artist: string;
  creatorName?: string;
  coverArt: string;
  spotifyUrl: string;
  spotifyUri: string;
  embedUrl: string;
  durationSec?: number;
  durationFormatted?: string;
  releaseDate?: string;
  releaseYear?: string;
  previewUrl?: string;
  trackCount?: number;
  followerCount?: number;
  genres?: string[];
  rawEmbedHtml?: string;
}


