export type UserRole = 'artist' | 'curator' | 'admin';

export interface CuratorGatesConfig {
  requireCuratorFollow: boolean;
  requirePlaylistFollow: boolean;
  requireSongSave: boolean;
  curatorSpotifyProfileUrl?: string;
  targetSongSpotifyUrl?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl: string;
  role: UserRole;
  spotifyId?: string;
  spotifyUri?: string;
  spotifyFollowers?: number;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  bio: string;
  creditBalance: number; // premium credits
  freeWeeklyCredits: number; // free weekly allowance (2 credits)
  lastWeeklyReset: string;
  verifiedStatus: boolean;
  totalSubmissions: number;
  totalPlacements: number;
  createdAt: string;
}

export interface TrackRecord {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  spotifyUrl: string;
  spotifyUri: string;
  previewUrl: string;
  durationSec: number;
  genre: string;
  bpm?: number;
  key?: string;
  releaseDate: string;
  artistSpotifyId?: string;
  playCount?: number;
}

export interface PlaylistRecord {
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
  approvalRate: number | null;
  avgResponseHours: number;
  pitchCostCredits: number;
  freePitchEnabled: boolean;
  spotlightTrack?: TrackRecord;
  isVerified: boolean;
  isFeatured?: boolean;
  acceptingSubmissions: boolean;
  recentAddedTracks?: TrackRecord[];
  gates?: CuratorGatesConfig;
  lastActiveAt?: string;
}

export type PitchType = 'free' | 'premium';
export type SubmissionStatus = 'pending' | 'approved' | 'declined' | 'added_to_playlist';

export interface SubmissionRecord {
  id: string;
  track: TrackRecord;
  playlistId: string;
  playlistTitle: string;
  playlistCover: string;
  curatorId: string;
  curatorName: string;
  artistId: string;
  artistName: string;
  artistAvatar: string;
  pitchType: PitchType;
  pitchCost: number;
  customMessage?: string;
  status: SubmissionStatus;
  feedbackTags: string[];
  feedbackNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  spotifyPlacementUrl?: string;
  gateActionsCompleted?: {
    followedCurator?: boolean;
    followedPlaylist?: boolean;
    savedSong?: boolean;
  };
}

export interface TransactionRecord {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'purchase' | 'free_pitch' | 'premium_pitch' | 'weekly_credit_reset' | 'curator_gate_reward' | 'admin_bonus';
  description: string;
  createdAt: string;
  status: 'completed' | 'pending';
  paypalAmountUsd?: number;
  paypalOrderId?: string;
  paypalPayerEmail?: string;
}

export interface EmailLogRecord {
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

export interface CuratorActivityRecord {
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
