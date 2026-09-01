export type UserRole = 'artist' | 'curator' | 'admin';

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
  creditBalance: number;
  earningsBalance: number; // in USD for curators
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
}

export interface CreditTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number; // positive or negative
  type: 'purchase' | 'free_pitch' | 'premium_pitch' | 'curator_reward' | 'admin_bonus';
  description: string;
  createdAt: string;
  status: 'completed' | 'pending';
  stripeAmountUsd?: number;
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
  type: 'placement_success' | 'pitch_declined' | 'credits_added' | 'new_submission' | 'curator_verified';
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

export type ActiveTab = 'home' | 'marketplace' | 'artist' | 'curator' | 'profile';
