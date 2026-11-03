import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'artist' | 'curator' | 'admin';
  spotifyId?: string;
  spotifyUri?: string;
  spotifyFollowers?: number;
  bio?: string;
  creditBalance: number;
  freeWeeklyCredits: number;
  lastWeeklyReset?: string;
  isVerified: boolean;
  curatorStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistRecord {
  id: string;
  title: string;
  description: string;
  curatorId: string;
  curatorName: string;
  curatorAvatar?: string;
  curatorSpotifyId?: string;
  coverArt: string;
  spotifyUrl: string;
  spotifyUri: string;
  followerCount: number;
  trackCount: number;
  genres: string[];
  pitchCostCredits: number;
  freePitchEnabled: boolean;
  avgResponseHours: number;
  approvalRate: number | null;
  isActive: boolean;
  isVerified: boolean;
  verificationCode?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  spotlightTrack?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionRecord {
  id: string;
  trackId: string;
  track: any;
  artistId: string;
  artistName: string;
  artistAvatar?: string;
  playlistId: string;
  playlistTitle: string;
  playlistCover?: string;
  curatorId: string;
  curatorName: string;
  pitchType: 'free' | 'premium';
  pitchCost: number;
  status: 'pending' | 'approved' | 'declined' | 'added_to_playlist';
  customMessage?: string;
  feedbackTags?: string[];
  feedbackNote?: string;
  spotifyPlacementUrl?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface LedgerRecord {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'free_pitch' | 'premium_pitch' | 'refund' | 'weekly_reset' | 'admin_adjustment';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  paypalOrderId?: string;
  paypalAmountUsd?: number;
  paypalPayerEmail?: string;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  reporterEmail?: string;
  targetType: 'playlist' | 'submission' | 'user' | 'track';
  targetId: string;
  targetTitle?: string;
  reason: string;
  details?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface EmailLogRecord {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  trackTitle?: string;
  playlistTitle?: string;
  status: string;
  errorMessage?: string;
  sentAt: string;
}

function getClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not initialized or database credentials are missing.');
  }
  return client;
}

/**
 * Supabase Postgres Primary Database Engine.
 * All operations execute strictly against Supabase Postgres with Row Level Security.
 * Zero in-memory fallbacks: any error from Supabase is thrown immediately.
 */
class SupabasePostgresDatabase {
  // ==========================================
  // PROFILES / USERS
  // ==========================================
  public async getUserProfile(id: string): Promise<UserRecord | null> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: data.role || 'artist',
      spotifyId: data.spotify_id,
      spotifyUri: data.spotify_uri,
      spotifyFollowers: data.spotify_followers || 0,
      bio: data.bio || '',
      creditBalance: data.credit_balance || 0,
      freeWeeklyCredits: data.free_weekly_credits ?? 2,
      lastWeeklyReset: data.last_weekly_reset,
      isVerified: data.is_verified || false,
      curatorStatus: data.curator_status || 'none',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  public async createProfile(profile: Partial<UserRecord> & { id: string; email: string; name: string }): Promise<UserRecord> {
    const supabase = getClient();
    const now = new Date().toISOString();
    const recordToInsert = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: profile.role || 'artist',
      credit_balance: profile.creditBalance ?? 0,
      free_weekly_credits: profile.freeWeeklyCredits ?? 2,
      bio: profile.bio || '',
      spotify_id: profile.spotifyId,
      spotify_uri: profile.spotifyUri,
      spotify_followers: profile.spotifyFollowers || 0,
      is_verified: profile.isVerified || false,
      curator_status: profile.curatorStatus || (profile.role === 'curator' ? 'pending' : 'none'),
      last_weekly_reset: now,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(recordToInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatar_url,
      role: data.role,
      creditBalance: data.credit_balance,
      freeWeeklyCredits: data.free_weekly_credits,
      bio: data.bio,
      spotifyId: data.spotify_id,
      spotifyUri: data.spotify_uri,
      spotifyFollowers: data.spotify_followers,
      isVerified: data.is_verified,
      curatorStatus: data.curator_status,
      lastWeeklyReset: data.last_weekly_reset,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * User profile update. USER CANNOT CHANGE ROLE OR CREDIT BALANCE.
   * Strips role, creditBalance, freeWeeklyCredits, isVerified to prevent tampering.
   */
  public async updateUserProfile(
    userId: string,
    updates: {
      name?: string;
      bio?: string;
      avatarUrl?: string;
      spotifyId?: string;
      spotifyUri?: string;
    }
  ): Promise<UserRecord | null> {
    const supabase = getClient();
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (updates.name && typeof updates.name === 'string') dbUpdates.name = updates.name.trim();
    if (updates.bio !== undefined && typeof updates.bio === 'string') dbUpdates.bio = updates.bio.trim();
    if (updates.avatarUrl && typeof updates.avatarUrl === 'string') dbUpdates.avatar_url = updates.avatarUrl.trim();
    if (updates.spotifyId && typeof updates.spotifyId === 'string') dbUpdates.spotify_id = updates.spotifyId.trim();
    if (updates.spotifyUri && typeof updates.spotifyUri === 'string') dbUpdates.spotify_uri = updates.spotifyUri.trim();

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatar_url,
      role: data.role,
      creditBalance: data.credit_balance,
      freeWeeklyCredits: data.free_weekly_credits,
      bio: data.bio,
      spotifyId: data.spotify_id,
      spotifyUri: data.spotify_uri,
      spotifyFollowers: data.spotify_followers,
      isVerified: data.is_verified,
      curatorStatus: data.curator_status,
      lastWeeklyReset: data.last_weekly_reset,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  public async deleteUserAccount(userId: string): Promise<boolean> {
    const supabase = getClient();
    // Nullify user_id on credit_ledger to preserve financial audit trail (ON DELETE SET NULL)
    await supabase.from('credit_ledger').update({ user_id: null }).eq('user_id', userId);
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      throw new Error(`Failed to delete user account: ${error.message}`);
    }
    return true;
  }

  // ==========================================
  // PLAYLISTS
  // ==========================================
  public async getPlaylists(filters?: {
    curatorId?: string;
    isVerified?: boolean;
    genre?: string;
    search?: string;
    onlyActive?: boolean;
  }): Promise<PlaylistRecord[]> {
    const supabase = getClient();
    let query = supabase.from('playlists').select('*');

    if (filters?.onlyActive) {
      query = query.eq('is_active', true).eq('verification_status', 'verified');
    }
    if (filters?.curatorId) {
      query = query.eq('curator_id', filters.curatorId);
    }
    if (filters?.genre && filters.genre !== 'All' && filters.genre !== 'All Genres') {
      query = query.contains('genres', [filters.genre]);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch playlists: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description || '',
      curatorId: d.curator_id,
      curatorName: d.curator_name,
      curatorAvatar: d.curator_avatar,
      curatorSpotifyId: d.curator_spotify_id,
      coverArt: d.cover_art,
      spotifyUrl: d.spotify_url,
      spotifyUri: d.spotify_uri,
      followerCount: d.follower_count || 0,
      trackCount: d.track_count || 0,
      genres: d.genres || [],
      pitchCostCredits: d.pitch_cost_credits || 1,
      freePitchEnabled: d.free_pitch_enabled ?? true,
      avgResponseHours: d.avg_response_hours || 24,
      approvalRate: d.approval_rate ?? null,
      isActive: d.is_active ?? true,
      isVerified: d.is_verified ?? false,
      verificationCode: d.verification_code,
      verificationStatus: d.verification_status || 'unverified',
      spotlightTrack: d.spotlight_track,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  public async getPlaylistById(id: string): Promise<PlaylistRecord | null> {
    const supabase = getClient();
    const { data, error } = await supabase.from('playlists').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch playlist: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      curatorId: data.curator_id,
      curatorName: data.curator_name,
      curatorAvatar: data.curator_avatar,
      curatorSpotifyId: data.curator_spotify_id,
      coverArt: data.cover_art,
      spotifyUrl: data.spotify_url,
      spotifyUri: data.spotify_uri,
      followerCount: data.follower_count || 0,
      trackCount: data.track_count || 0,
      genres: data.genres || [],
      pitchCostCredits: data.pitch_cost_credits || 1,
      freePitchEnabled: data.free_pitch_enabled ?? true,
      avgResponseHours: data.avg_response_hours || 24,
      approvalRate: data.approval_rate ?? null,
      isActive: data.is_active ?? true,
      isVerified: data.is_verified ?? false,
      verificationCode: data.verification_code,
      verificationStatus: data.verification_status || 'unverified',
      spotlightTrack: data.spotlight_track,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  public async createPlaylist(data: Omit<PlaylistRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlaylistRecord> {
    const supabase = getClient();
    const id = `pl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const insertData = {
      id,
      title: data.title,
      description: data.description,
      curator_id: data.curatorId,
      curator_name: data.curatorName,
      curator_avatar: data.curatorAvatar,
      cover_art: data.coverArt,
      spotify_url: data.spotifyUrl,
      spotify_uri: data.spotifyUri,
      follower_count: data.followerCount || 0,
      track_count: data.trackCount || 0,
      genres: data.genres || [],
      pitch_cost_credits: data.pitchCostCredits || 1,
      free_pitch_enabled: data.freePitchEnabled ?? true,
      is_active: data.isActive ?? true,
      is_verified: data.isVerified ?? false,
      verification_code: data.verificationCode,
      verification_status: data.verificationStatus || 'unverified',
      spotlight_track: data.spotlightTrack,
      created_at: now,
      updated_at: now
    };

    const { data: created, error } = await supabase.from('playlists').insert(insertData).select().single();
    if (error) {
      throw new Error(`Failed to create playlist: ${error.message}`);
    }

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      curatorId: created.curator_id,
      curatorName: created.curator_name,
      curatorAvatar: created.curator_avatar,
      curatorSpotifyId: created.curator_spotify_id,
      coverArt: created.cover_art,
      spotifyUrl: created.spotify_url,
      spotifyUri: created.spotify_uri,
      followerCount: created.follower_count,
      trackCount: created.track_count,
      genres: created.genres,
      pitchCostCredits: created.pitch_cost_credits,
      freePitchEnabled: created.free_pitch_enabled,
      avgResponseHours: created.avg_response_hours || 24,
      approvalRate: created.approval_rate ?? null,
      isActive: created.is_active,
      isVerified: created.is_verified,
      verificationCode: created.verification_code,
      verificationStatus: created.verification_status,
      spotlightTrack: created.spotlight_track,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };
  }

  public async updatePlaylist(id: string, updates: Partial<PlaylistRecord>): Promise<PlaylistRecord | null> {
    const supabase = getClient();
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified;
    if (updates.verificationStatus) dbUpdates.verification_status = updates.verificationStatus;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.title) dbUpdates.title = updates.title;

    const { data, error } = await supabase.from('playlists').update(dbUpdates).eq('id', id).select().single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to update playlist: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      curatorId: data.curator_id,
      curatorName: data.curator_name,
      curatorAvatar: data.curator_avatar,
      curatorSpotifyId: data.curator_spotify_id,
      coverArt: data.cover_art,
      spotifyUrl: data.spotify_url,
      spotifyUri: data.spotify_uri,
      followerCount: data.follower_count || 0,
      trackCount: data.track_count || 0,
      genres: data.genres || [],
      pitchCostCredits: data.pitch_cost_credits || 1,
      freePitchEnabled: data.free_pitch_enabled ?? true,
      avgResponseHours: data.avg_response_hours || 24,
      approvalRate: data.approval_rate ?? null,
      isActive: data.is_active ?? true,
      isVerified: data.is_verified ?? false,
      verificationCode: data.verification_code,
      verificationStatus: data.verification_status || 'unverified',
      spotlightTrack: data.spotlight_track,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // ==========================================
  // SUBMISSIONS (ATOMIC SPEND & SUBMIT)
  // ==========================================
  public async getSubmissions(filters?: {
    artistId?: string;
    curatorId?: string;
    playlistId?: string;
    status?: string;
  }): Promise<SubmissionRecord[]> {
    const supabase = getClient();
    let query = supabase.from('submissions').select('*');
    if (filters?.artistId) query = query.eq('artist_id', filters.artistId);
    if (filters?.curatorId) query = query.eq('curator_id', filters.curatorId);
    if (filters?.playlistId) query = query.eq('playlist_id', filters.playlistId);
    if (filters?.status) query = query.eq('status', filters.status);

    query = query.order('submitted_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      trackId: d.track_id,
      track: d.track,
      artistId: d.artist_id,
      artistName: d.artist_name,
      artistAvatar: d.artist_avatar,
      playlistId: d.playlist_id,
      playlistTitle: d.playlist_title,
      playlistCover: d.playlist_cover,
      curatorId: d.curator_id,
      curatorName: d.curator_name,
      pitchType: d.pitch_type,
      pitchCost: d.pitch_cost || 0,
      status: d.status,
      customMessage: d.custom_message,
      feedbackTags: d.feedback_tags || [],
      feedbackNote: d.feedback_note,
      spotifyPlacementUrl: d.spotify_placement_url,
      submittedAt: d.submitted_at,
      reviewedAt: d.reviewed_at
    }));
  }

  public async getSubmissionById(id: string): Promise<SubmissionRecord | null> {
    const supabase = getClient();
    const { data, error } = await supabase.from('submissions').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch submission: ${error.message}`);
    }

    return {
      id: data.id,
      trackId: data.track_id,
      track: data.track,
      artistId: data.artist_id,
      artistName: data.artist_name,
      artistAvatar: data.artist_avatar,
      playlistId: data.playlist_id,
      playlistTitle: data.playlist_title,
      playlistCover: data.playlist_cover,
      curatorId: data.curator_id,
      curatorName: data.curator_name,
      pitchType: data.pitch_type,
      pitchCost: data.pitch_cost || 0,
      status: data.status,
      customMessage: data.custom_message,
      feedbackTags: data.feedback_tags || [],
      feedbackNote: data.feedback_note,
      spotifyPlacementUrl: data.spotify_placement_url,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at
    };
  }

  /**
   * Spends credits and creates submission in one atomic transaction.
   */
  public async spendCreditsAndCreateSubmission(params: {
    artistId: string;
    playlistId: string;
    track: any;
    pitchType: 'free' | 'premium';
    customMessage?: string;
  }): Promise<{ submission: SubmissionRecord; newBalance: number }> {
    const { artistId, playlistId, track, pitchType, customMessage } = params;
    const supabase = getClient();

    const { data, error } = await supabase.rpc('spend_credits_and_create_submission', {
      p_artist_id: artistId,
      p_playlist_id: playlistId,
      p_track: track,
      p_pitch_type: pitchType,
      p_custom_message: customMessage || ''
    });

    if (error) {
      throw new Error(`Failed to spend credits and create submission: ${error.message}`);
    }

    const profile = await this.getUserProfile(artistId);

    return {
      submission: {
        id: data.id,
        trackId: data.track_id,
        track: data.track,
        artistId: data.artist_id,
        artistName: data.artist_name,
        artistAvatar: data.artist_avatar,
        playlistId: data.playlist_id,
        playlistTitle: data.playlist_title,
        playlistCover: data.playlist_cover,
        curatorId: data.curator_id,
        curatorName: data.curator_name,
        pitchType: data.pitch_type,
        pitchCost: data.pitch_cost || 0,
        status: data.status,
        customMessage: data.custom_message,
        feedbackTags: data.feedback_tags || [],
        feedbackNote: data.feedback_note,
        submittedAt: data.submitted_at
      },
      newBalance: profile?.creditBalance || 0
    };
  }

  public async reviewSubmission(params: {
    submissionId: string;
    decision: 'approve' | 'decline';
    feedbackTags?: string[];
    feedbackNote?: string;
    spotifyPlacementUrl?: string;
  }): Promise<SubmissionRecord | null> {
    const supabase = getClient();
    const status = params.decision === 'approve' ? 'approved' : 'declined';
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('submissions')
      .update({
        status,
        feedback_tags: params.feedbackTags || [],
        feedback_note: params.feedbackNote || '',
        spotify_placement_url: params.spotifyPlacementUrl,
        reviewed_at: now
      })
      .eq('id', params.submissionId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to review submission: ${error.message}`);
    }

    return {
      id: data.id,
      trackId: data.track_id,
      track: data.track,
      artistId: data.artist_id,
      artistName: data.artist_name,
      artistAvatar: data.artist_avatar,
      playlistId: data.playlist_id,
      playlistTitle: data.playlist_title,
      playlistCover: data.playlist_cover,
      curatorId: data.curator_id,
      curatorName: data.curator_name,
      pitchType: data.pitch_type,
      pitchCost: data.pitch_cost || 0,
      status: data.status,
      customMessage: data.custom_message,
      feedbackTags: data.feedback_tags || [],
      feedbackNote: data.feedback_note,
      spotifyPlacementUrl: data.spotify_placement_url,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at
    };
  }

  // ==========================================
  // CREDIT WALLET & LEDGER (IDEMPOTENT & ATOMIC)
  // ==========================================
  public async creditWallet(params: {
    userId: string;
    amount: number;
    type: 'purchase' | 'refund' | 'admin_adjustment';
    description: string;
    paypalOrderId?: string;
    paypalAmountUsd?: number;
    paypalPayerEmail?: string;
  }): Promise<{ success: boolean; newBalance: number; transactionId: string; idempotent: boolean }> {
    const { userId, amount, type, description, paypalOrderId, paypalAmountUsd, paypalPayerEmail } = params;
    const supabase = getClient();

    const { data, error } = await supabase.rpc('credit_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description,
      p_paypal_order_id: paypalOrderId || null,
      p_paypal_amount_usd: paypalAmountUsd || null,
      p_paypal_payer_email: paypalPayerEmail || null
    });

    if (error) {
      throw new Error(`Failed to credit wallet: ${error.message}`);
    }

    return {
      success: true,
      newBalance: data.new_balance,
      transactionId: data.transaction_id,
      idempotent: Boolean(data.idempotent)
    };
  }

  /**
   * Atomic refund for submissions via PostgreSQL RPC function
   */
  public async refundSubmissionCredits(
    submissionId: string,
    reason = '48-Hour SLA Guarantee Exceeded'
  ): Promise<{ success: boolean; submissionId: string; refundedAmount: number; newBalance: number }> {
    const supabase = getClient();
    const { data, error } = await supabase.rpc('refund_submission_credits', {
      p_submission_id: submissionId,
      p_reason: reason
    });

    if (error) {
      throw new Error(`Failed to refund submission credits: ${error.message}`);
    }

    return {
      success: true,
      submissionId: data.submission_id,
      refundedAmount: data.refunded_amount,
      newBalance: data.new_balance
    };
  }

  public async getTransactionsForUser(userId: string): Promise<LedgerRecord[]> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('credit_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      amount: d.amount,
      type: d.type,
      description: d.description,
      status: d.status,
      paypalOrderId: d.paypal_order_id,
      paypalAmountUsd: d.paypal_amount_usd,
      paypalPayerEmail: d.paypal_payer_email,
      createdAt: d.created_at
    }));
  }

  // ==========================================
  // ABUSE REPORTS (PHASE 6)
  // ==========================================
  public async createReport(data: Omit<ReportRecord, 'id' | 'status' | 'createdAt'>): Promise<ReportRecord> {
    const supabase = getClient();
    const id = `rep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const insertData = {
      id,
      reporter_id: data.reporterId,
      reporter_email: data.reporterEmail,
      target_type: data.targetType,
      target_id: data.targetId,
      target_title: data.targetTitle,
      reason: data.reason,
      details: data.details,
      status: 'open',
      created_at: now
    };

    const { data: created, error } = await supabase.from('reports').insert(insertData).select().single();
    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    return {
      id: created.id,
      reporterId: created.reporter_id,
      reporterEmail: created.reporter_email,
      targetType: created.target_type,
      targetId: created.target_id,
      targetTitle: created.target_title,
      reason: created.reason,
      details: created.details,
      status: created.status,
      createdAt: created.created_at
    };
  }

  public async getReports(): Promise<ReportRecord[]> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      reporterId: d.reporter_id,
      reporterEmail: d.reporter_email,
      targetType: d.target_type,
      targetId: d.target_id,
      targetTitle: d.target_title,
      reason: d.reason,
      details: d.details,
      status: d.status,
      adminNotes: d.admin_notes,
      createdAt: d.created_at,
      resolvedAt: d.resolved_at
    }));
  }

  public async updateReportStatus(id: string, status: 'resolved' | 'dismissed', adminNotes?: string): Promise<boolean> {
    const supabase = getClient();
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        admin_notes: adminNotes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update report status: ${error.message}`);
    }

    return true;
  }

  // ==========================================
  // TRANSACTIONAL EMAIL LOGS (PHASE 6)
  // ==========================================
  public async logEmail(data: Omit<EmailLogRecord, 'id' | 'sentAt'>): Promise<EmailLogRecord> {
    const supabase = getClient();
    const id = `em_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const insertData = {
      id,
      recipient: data.recipient,
      subject: data.subject,
      template: data.template,
      track_title: data.trackTitle,
      playlist_title: data.playlistTitle,
      status: data.status,
      error_message: data.errorMessage,
      sent_at: now
    };

    const { data: created, error } = await supabase.from('email_logs').insert(insertData).select().single();
    if (error) {
      throw new Error(`Failed to log email: ${error.message}`);
    }

    return {
      id: created.id,
      recipient: created.recipient,
      subject: created.subject,
      template: created.template,
      trackTitle: created.track_title,
      playlistTitle: created.playlist_title,
      status: created.status,
      errorMessage: created.error_message,
      sentAt: created.sent_at
    };
  }

  public async getEmails(): Promise<EmailLogRecord[]> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch email logs: ${error.message}`);
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      recipient: d.recipient,
      subject: d.subject,
      template: d.template,
      trackTitle: d.track_title,
      playlistTitle: d.playlist_title,
      status: d.status,
      errorMessage: d.error_message,
      sentAt: d.sent_at
    }));
  }

  // ==========================================
  // DATABASE BACKUP (PHASE 6)
  // ==========================================
  public async exportDatabaseSnapshot(): Promise<Record<string, any>> {
    const supabase = getClient();
    const [profiles, playlists, submissions, ledger, reports, emailLogs] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('playlists').select('*'),
      supabase.from('submissions').select('*'),
      supabase.from('credit_ledger').select('*'),
      supabase.from('reports').select('*'),
      supabase.from('email_logs').select('*')
    ]);

    if (profiles.error) throw new Error(`Snapshot error on profiles: ${profiles.error.message}`);
    if (playlists.error) throw new Error(`Snapshot error on playlists: ${playlists.error.message}`);
    if (submissions.error) throw new Error(`Snapshot error on submissions: ${submissions.error.message}`);
    if (ledger.error) throw new Error(`Snapshot error on credit_ledger: ${ledger.error.message}`);
    if (reports.error) throw new Error(`Snapshot error on reports: ${reports.error.message}`);
    if (emailLogs.error) throw new Error(`Snapshot error on email_logs: ${emailLogs.error.message}`);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profiles: profiles.data || [],
      playlists: playlists.data || [],
      submissions: submissions.data || [],
      creditLedger: ledger.data || [],
      reports: reports.data || [],
      emailLogs: emailLogs.data || []
    };
  }
}

export const db = new SupabasePostgresDatabase();
