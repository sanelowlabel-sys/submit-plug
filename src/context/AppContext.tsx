import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  UserProfile,
  UserRole,
  Playlist,
  Track,
  Submission,
  CreditTransaction,
  AppNotification,
  PitchType,
  ActiveTab,
  ToastNotification,
  SpotifyParsedMetadata,
  AbuseReport
} from '../types';
import { globalAudioEngine } from '../utils/audioEngine';
import { fetchSpotifyMetadata } from '../utils/spotifyParser';
import confetti from 'canvas-confetti';
import {
  supabase,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  supabaseResetPassword,
  getSupabaseAccessToken,
  subscribeToRealtimeSubmissions
} from '../lib/supabase';

export interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playlistContext?: string;
  activeSpotifyType?: 'track' | 'playlist' | 'album' | 'artist';
  activeSpotifyId?: string;
  embedUrl?: string;
  isEmbedExpanded?: boolean;
  isMuted?: boolean;
  volume?: number;
  parsedMetadata?: SpotifyParsedMetadata | null;
}

interface AppContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, role: UserRole, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => void;
  deleteAccount: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;

  activeRole: UserRole;
  switchUserRole: (role: UserRole) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Playlists
  playlists: Playlist[];
  userPlaylists: Playlist[];
  addPlaylist: (playlistData: any) => Promise<Playlist | null>;
  togglePlaylistStatus: (id: string) => Promise<void>;
  verifyPlaylistCode: (playlistId: string) => Promise<{ verified: boolean; message: string }>;
  requestPlaylistAdminReview: (playlistId: string) => Promise<boolean>;

  // Submissions & Pitching
  submissions: Submission[];
  artistSubmissions: Submission[];
  curatorInboxSubmissions: Submission[];
  submitPitch: (
    arg1: any,
    arg2?: string,
    arg3?: PitchType,
    arg4?: string
  ) => Promise<{ success: boolean; message: string; submission?: Submission; error?: string }>;
  reviewSubmission: (
    submissionId: string,
    action: 'approve' | 'decline',
    feedbackTags: string[],
    feedbackNote?: string,
    spotifyPlacementUrl?: string
  ) => Promise<void>;

  // Credits & Wallet
  transactions: CreditTransaction[];
  purchaseCredits: (packageId: string) => Promise<{ success: boolean; error?: string; approveUrl?: string }>;
  freeWeeklyCredits: number;

  // Modals
  pitchModalOpen: boolean;
  selectedPlaylistForPitch: Playlist | null;
  openPitchModal: (playlist?: Playlist) => void;
  closePitchModal: () => void;
  spotifyWizardOpen: boolean;
  setSpotifyWizardOpen: (open: boolean) => void;
  openSpotifyWizard: (playlist?: Playlist) => void;
  buyCreditsModalOpen: boolean;
  setBuyCreditsModalOpen: (open: boolean) => void;
  onboardPlaylistModalOpen: boolean;
  setOnboardPlaylistModalOpen: (open: boolean) => void;

  // Legal Modals & Pages
  legalModalOpen: boolean;
  setLegalModalOpen: (open: boolean) => void;
  legalModalTab: 'terms' | 'privacy' | 'refund';
  openLegalModal: (tab: 'terms' | 'privacy' | 'refund') => void;

  // Abuse Reporting
  reportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;
  reportTarget: { type: 'playlist' | 'submission' | 'user' | 'track'; id: string; title: string } | null;
  openReportModal: (type: 'playlist' | 'submission' | 'user' | 'track', id: string, title: string) => void;
  submitAbuseReport: (reason: string, details: string) => Promise<boolean>;

  // Admin Controls
  adminMetrics: any;
  pendingPlaylists: Playlist[];
  abuseReports: AbuseReport[];
  fetchAdminData: () => Promise<void>;
  approveCuratorPlaylist: (id: string) => Promise<boolean>;
  rejectCuratorPlaylist: (id: string) => Promise<boolean>;
  resolveAbuseReport: (id: string, status: 'resolved' | 'dismissed', notes?: string) => Promise<boolean>;
  refundSubmissionCredits: (submissionId: string, reason?: string) => Promise<boolean>;
  exportDatabaseBackup: () => Promise<void>;

  // User tracks
  artistTracks: Track[];
  addArtistTrack: (track: Omit<Track, 'id'>) => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Audio Engine & Playback
  audioState: AudioState;
  playTrack: (track: Track, playlistContext?: string) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopAudio: () => void;
  seekAudio: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleEmbedExpanded: () => void;
  playSpotifyUrl: (urlOrUri: string, contextTitle?: string) => Promise<boolean>;
  playNextTrack: () => void;
  playPreviousTrack: () => void;

  // Toast Notifications
  toasts: ToastNotification[];
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning', durationMs?: number) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('artist');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Auth modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  // User profile state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const isAuthenticated = Boolean(currentUser);

  // Core Data Lists - Starts EMPTY (zero seeded demo data)
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals state
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [selectedPlaylistForPitch, setSelectedPlaylistForPitch] = useState<Playlist | null>(null);
  const [spotifyWizardOpen, setSpotifyWizardOpen] = useState(false);
  const [buyCreditsModalOpen, setBuyCreditsModalOpen] = useState(false);
  const [onboardPlaylistModalOpen, setOnboardPlaylistModalOpen] = useState(false);

  // Legal Modal
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'refund'>('terms');
  const openLegalModal = (tab: 'terms' | 'privacy' | 'refund') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'playlist' | 'submission' | 'user' | 'track'; id: string; title: string } | null>(null);
  const openReportModal = (type: 'playlist' | 'submission' | 'user' | 'track', id: string, title: string) => {
    setReportTarget({ type, id, title });
    setReportModalOpen(true);
  };

  // Admin Data
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [pendingPlaylists, setPendingPlaylists] = useState<Playlist[]>([]);
  const [abuseReports, setAbuseReports] = useState<AbuseReport[]>([]);

  const openSpotifyWizard = (playlist?: Playlist) => {
    if (playlist) {
      setSelectedPlaylistForPitch(playlist);
    }
    setSpotifyWizardOpen(true);
  };

  // Audio state (Empty by default)
  const [audioState, setAudioState] = useState<AudioState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isEmbedExpanded: false,
    volume: 0.8,
    isMuted: false
  });

  // Global Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    durationMs = 4500
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      timestamp: Date.now(),
      durationMs
    };
    setToasts(prev => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      removeToast(id);
    }, durationMs);
  }, [removeToast]);

  // Authenticated API request helper with Bearer token
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getSupabaseAccessToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  }, []);

  // Fetch verified user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setActiveRole(data.user.role || 'artist');
        } else {
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.warn('[AppContext] Failed to fetch current user:', err);
    }
  }, [authenticatedFetch]);

  // Fetch Playlists from Postgres
  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to load playlists:', err);
    }
  }, [authenticatedFetch]);

  // Fetch Submissions
  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {}
  }, [authenticatedFetch]);

  // Fetch Wallet & Ledger
  const fetchWallet = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (currentUser && data.creditBalance !== undefined) {
          setCurrentUser(prev => prev ? {
            ...prev,
            creditBalance: data.creditBalance,
            freeWeeklyCredits: data.freeWeeklyCredits ?? prev.freeWeeklyCredits
          } : null);
        }
      }
    } catch (err) {}
  }, [authenticatedFetch, currentUser]);

  // Fetch Admin Data
  const fetchAdminData = useCallback(async () => {
    try {
      const [metricsRes, pendingRes, reportsRes] = await Promise.all([
        authenticatedFetch('/api/admin/metrics'),
        authenticatedFetch('/api/admin/playlists/pending'),
        authenticatedFetch('/api/admin/reports')
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setAdminMetrics(m);
      }
      if (pendingRes.ok) {
        const p = await pendingRes.json();
        setPendingPlaylists(p.playlists || []);
      }
      if (reportsRes.ok) {
        const r = await reportsRes.json();
        setAbuseReports(r.reports || []);
      }
    } catch (err) {}
  }, [authenticatedFetch]);

  // Listen to Supabase Auth State Changes
  useEffect(() => {
    // Initial fetch of profile and public playlists
    fetchPlaylists();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile();
        fetchSubmissions();
        fetchWallet();
      } else {
        setCurrentUser(null);
        setSubmissions([]);
        setTransactions([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, fetchPlaylists, fetchSubmissions, fetchWallet]);

  // Supabase Realtime Subscription (respects RLS)
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = subscribeToRealtimeSubmissions(currentUser.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newSub = payload.new;
        setSubmissions(prev => [newSub, ...prev.filter(s => s.id !== newSub.id)]);
        showToast('Realtime Update', `New submission received for "${newSub.playlist_title || 'playlist'}"`, 'info');
      } else if (payload.eventType === 'UPDATE') {
        const updated = payload.new;
        setSubmissions(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
        if (updated.status === 'approved') {
          showToast('Pitch Approved!', `Your pitch for "${updated.playlist_title}" was approved!`, 'success');
          try { confetti({ particleCount: 70, spread: 60 }); } catch {}
        }
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, showToast]);

  // Supabase Auth Methods
  const login = async (email: string, password: string) => {
    const res = await supabaseSignIn(email, password);
    if (res.success) {
      await fetchUserProfile();
      await fetchSubmissions();
      await fetchWallet();
      setAuthModalOpen(false);
      showToast('Welcome back', 'Signed in successfully via Supabase Auth.', 'success');
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = async (name: string, email: string, role: UserRole, password: string) => {
    const res = await supabaseSignUp(name, email, password, role);
    if (res.success) {
      if (res.requiresEmailConfirmation) {
        showToast(
          'Account Created',
          'Please check your email inbox to confirm your account before signing in.',
          'info',
          6000
        );
        return { success: true, requiresEmailConfirmation: true };
      }
      await fetchUserProfile();
      setAuthModalOpen(false);
      showToast('Account Created', 'Welcome to Playlist Plug!', 'success');
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    await supabaseSignOut();
    setCurrentUser(null);
    setSubmissions([]);
    setTransactions([]);
    setActiveTab('home');
    showToast('Signed Out', 'You have been signed out safely.', 'info');
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const res = await authenticatedFetch('/api/auth/delete-account', { method: 'DELETE' });
      if (res.ok) {
        await supabaseSignOut();
        setCurrentUser(null);
        setSubmissions([]);
        setTransactions([]);
        setActiveTab('home');
        showToast('Account Deleted', 'Your account and data have been removed.', 'info');
        return true;
      }
    } catch (e) {}
    return false;
  };

  const resetPassword = async (email: string) => {
    return supabaseResetPassword(email);
  };

  const switchUserRole = (role: UserRole) => {
    setActiveRole(role);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      const res = await authenticatedFetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        showToast('Profile Updated', 'Your profile details have been saved.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update profile', 'error');
    }
  };

  // Playlists
  const userPlaylists = playlists.filter(p => currentUser && p.curatorId === currentUser.id);

  const addPlaylist = async (playlistData: any): Promise<Playlist | null> => {
    try {
      const res = await authenticatedFetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistData)
      });

      if (!res.ok) {
        const err = await res.json();
        showToast('Error', err.error || 'Failed to add playlist', 'error');
        return null;
      }

      const data = await res.json();
      setPlaylists(prev => [data.playlist, ...prev]);
      showToast(
        'Playlist Added',
        `Verification code: ${data.verificationCode}. Paste into playlist description to verify.`,
        'success',
        8000
      );
      return data.playlist;
    } catch (err: any) {
      showToast('Error', err.message || 'Network error adding playlist', 'error');
      return null;
    }
  };

  const togglePlaylistStatus = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/api/playlists/${id}/toggle-status`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(prev => prev.map(p => p.id === id ? data.playlist : p));
      }
    } catch (e) {}
  };

  const verifyPlaylistCode = async (playlistId: string): Promise<{ verified: boolean; message: string }> => {
    try {
      const res = await authenticatedFetch(`/api/playlists/${playlistId}/verify-code`, { method: 'POST' });
      const data = await res.json();
      if (data.verified) {
        setPlaylists(prev => prev.map(p => p.id === playlistId ? data.playlist : p));
        showToast('Ownership Verified!', data.message, 'success');
        return { verified: true, message: data.message };
      }
      showToast('Verification Notice', data.message, 'warning');
      return { verified: false, message: data.message };
    } catch (err: any) {
      return { verified: false, message: err.message || 'Verification failed' };
    }
  };

  const requestPlaylistAdminReview = async (playlistId: string): Promise<boolean> => {
    try {
      const res = await authenticatedFetch(`/api/playlists/${playlistId}/request-admin-review`, { method: 'POST' });
      if (res.ok) {
        showToast('Submitted for Admin Review', 'An admin will review and verify your playlist.', 'info');
        return true;
      }
    } catch (e) {}
    return false;
  };

  // Submissions & Pitching
  const artistSubmissions = submissions.filter(s => currentUser && s.artistId === currentUser.id);
  const curatorInboxSubmissions = submissions.filter(s => currentUser && s.curatorId === currentUser.id);

  const submitPitch = async (
    arg1: any,
    arg2?: string,
    arg3?: PitchType,
    arg4?: string
  ): Promise<{ success: boolean; message: string; submission?: Submission; error?: string }> => {
    if (!currentUser) {
      openLoginModal();
      return { success: false, message: 'Please sign in to pitch your music.', error: 'auth_required' };
    }

    let playlistId: string;
    let track: any;
    let pitchType: PitchType = 'premium';
    let customMessage = '';

    if (typeof arg1 === 'object' && arg1.playlistId) {
      playlistId = arg1.playlistId;
      track = arg1.track;
      pitchType = arg1.pitchType || 'premium';
      customMessage = arg1.customMessage || '';
    } else {
      playlistId = arg2 || '';
      track = arg1;
      pitchType = arg3 || 'premium';
      customMessage = arg4 || '';
    }

    try {
      const res = await authenticatedFetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId,
          track,
          pitchType,
          customMessage
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Submission failed', error: resData.error };
      }

      if (resData.newBalance !== undefined) {
        setCurrentUser(prev => prev ? { ...prev, creditBalance: resData.newBalance } : null);
      }

      if (resData.submission) {
        setSubmissions(prev => [resData.submission, ...prev]);
      }

      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch {}

      return {
        success: true,
        message: 'Pitch successfully dispatched to curator!',
        submission: resData.submission
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Submission error', error: err.message };
    }
  };

  const reviewSubmission = async (
    submissionId: string,
    action: 'approve' | 'decline',
    feedbackTags: string[],
    feedbackNote?: string,
    spotifyPlacementUrl?: string
  ) => {
    try {
      const res = await authenticatedFetch(`/api/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: action,
          feedbackTags,
          feedbackNote,
          spotifyPlacementUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.submission) {
          setSubmissions(prev => prev.map(s => s.id === submissionId ? data.submission : s));
        }
        showToast(
          action === 'approve' ? 'Submission Approved!' : 'Submission Declined',
          data.message,
          action === 'approve' ? 'success' : 'info'
        );
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'Failed to review submission', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Review network error', 'error');
    }
  };

  // Payments (PayPal server-side order & capture)
  const purchaseCredits = async (packageId: string): Promise<{ success: boolean; error?: string; approveUrl?: string }> => {
    if (!currentUser) {
      openLoginModal();
      return { success: false, error: 'Authentication required' };
    }

    try {
      // 1. Create order server-side with fixed package price
      const orderRes = await authenticatedFetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        showToast('PayPal Gateway', orderData.error || 'Failed to initialize PayPal order', 'error');
        return { success: false, error: orderData.error };
      }

      // If approveUrl is available, return it for user redirect/popup
      return {
        success: true,
        approveUrl: orderData.approveUrl
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Abuse Reporting
  const submitAbuseReport = async (reason: string, details: string): Promise<boolean> => {
    if (!reportTarget) return false;
    try {
      const res = await authenticatedFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: reportTarget.type,
          targetId: reportTarget.id,
          targetTitle: reportTarget.title,
          reason,
          details
        })
      });

      if (res.ok) {
        showToast('Report Submitted', 'Our moderation team will review this report.', 'success');
        setReportModalOpen(false);
        return true;
      }
    } catch (e) {}
    return false;
  };

  // Admin Actions
  const approveCuratorPlaylist = async (id: string): Promise<boolean> => {
    try {
      const res = await authenticatedFetch(`/api/admin/playlists/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        showToast('Playlist Approved', 'Playlist verified and live on marketplace.', 'success');
        await fetchAdminData();
        await fetchPlaylists();
        return true;
      }
    } catch (e) {}
    return false;
  };

  const rejectCuratorPlaylist = async (id: string): Promise<boolean> => {
    try {
      const res = await authenticatedFetch(`/api/admin/playlists/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        showToast('Playlist Rejected', 'Playlist status updated.', 'info');
        await fetchAdminData();
        return true;
      }
    } catch (e) {}
    return false;
  };

  const resolveAbuseReport = async (id: string, status: 'resolved' | 'dismissed', notes?: string): Promise<boolean> => {
    try {
      const res = await authenticatedFetch(`/api/admin/reports/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes })
      });
      if (res.ok) {
        showToast('Report Updated', `Report marked as ${status}.`, 'info');
        await fetchAdminData();
        return true;
      }
    } catch (e) {}
    return false;
  };

  const refundSubmissionCredits = async (submissionId: string, reason?: string): Promise<boolean> => {
    try {
      const res = await authenticatedFetch(`/api/admin/submissions/${submissionId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Credits Refunded', data.message, 'success');
        await fetchSubmissions();
        await fetchAdminData();
        return true;
      }
    } catch (e) {}
    return false;
  };

  const exportDatabaseBackup = async () => {
    try {
      const res = await authenticatedFetch('/api/admin/backup');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `playlist_plug_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast('Backup Exported', 'Database snapshot downloaded successfully.', 'success');
      }
    } catch (e) {
      showToast('Error', 'Failed to export backup.', 'error');
    }
  };

  // Artist Tracks
  const addArtistTrack = async (track: Omit<Track, 'id'>) => {
    try {
      const res = await authenticatedFetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track)
      });
      if (res.ok) {
        const data = await res.json();
        setArtistTracks(prev => [data.track, ...prev]);
        showToast('Track Added', `"${data.track.title}" added to your catalog.`, 'success');
      }
    } catch (e) {}
  };

  // Notifications
  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Audio Playback Engine
  const playTrack = (track: Track, playlistContext?: string) => {
    if (!track.previewUrl) {
      // Fallback: Open embed or alert that preview is Spotify-exclusive
      setAudioState(prev => ({
        ...prev,
        currentTrack: track,
        playlistContext,
        isPlaying: false,
        embedUrl: track.spotifyUrl ? `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0` : undefined,
        isEmbedExpanded: true
      }));
      showToast('Audio Notice', 'Full preview playing via Spotify Web Player embed.', 'info');
      return;
    }

    globalAudioEngine.load(track.previewUrl);
    globalAudioEngine.play();
    setAudioState(prev => ({
      ...prev,
      currentTrack: track,
      playlistContext,
      isPlaying: true,
      currentTime: 0,
      duration: track.durationSec || 180
    }));
  };

  const pauseTrack = () => {
    globalAudioEngine.pause();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  };

  const resumeTrack = () => {
    globalAudioEngine.resume();
    setAudioState(prev => ({ ...prev, isPlaying: true }));
  };

  const stopAudio = () => {
    globalAudioEngine.stop();
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  };

  const seekAudio = (seconds: number) => {
    globalAudioEngine.seek(seconds);
    setAudioState(prev => ({ ...prev, currentTime: seconds }));
  };

  const setVolume = (vol: number) => {
    globalAudioEngine.setVolume(vol);
    setAudioState(prev => ({ ...prev, volume: vol }));
  };

  const toggleMute = () => {
    const nextMuted = !audioState.isMuted;
    globalAudioEngine.setVolume(nextMuted ? 0 : (audioState.volume || 0.8));
    setAudioState(prev => ({ ...prev, isMuted: nextMuted }));
  };

  const toggleEmbedExpanded = () => {
    setAudioState(prev => ({ ...prev, isEmbedExpanded: !prev.isEmbedExpanded }));
  };

  const playSpotifyUrl = async (urlOrUri: string, contextTitle?: string): Promise<boolean> => {
    const meta = await fetchSpotifyMetadata(urlOrUri);
    if (!meta) return false;

    const track: Track = {
      id: meta.id,
      title: meta.title,
      artist: meta.artist || meta.creatorName || 'Artist',
      albumArt: meta.coverArt,
      spotifyUrl: meta.spotifyUrl,
      spotifyUri: meta.spotifyUri,
      previewUrl: meta.previewUrl || '',
      durationSec: meta.durationSec || 180,
      genre: meta.genres?.[0] || 'Alternative',
      releaseDate: meta.releaseDate || '2026'
    };

    playTrack(track, contextTitle || meta.title);
    return true;
  };

  const playNextTrack = () => {};
  const playPreviousTrack = () => {};

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        register,
        logout,
        deleteAccount,
        resetPassword,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,

        activeRole,
        switchUserRole,
        updateUserProfile,

        activeTab,
        setActiveTab,

        playlists,
        userPlaylists,
        addPlaylist,
        togglePlaylistStatus,
        verifyPlaylistCode,
        requestPlaylistAdminReview,

        submissions,
        artistSubmissions,
        curatorInboxSubmissions,
        submitPitch,
        reviewSubmission,

        transactions,
        purchaseCredits,
        freeWeeklyCredits: currentUser?.freeWeeklyCredits ?? 2,

        pitchModalOpen,
        selectedPlaylistForPitch,
        openPitchModal: (p) => {
          if (p) setSelectedPlaylistForPitch(p);
          setPitchModalOpen(true);
        },
        closePitchModal: () => setPitchModalOpen(false),
        spotifyWizardOpen,
        setSpotifyWizardOpen,
        openSpotifyWizard,
        buyCreditsModalOpen,
        setBuyCreditsModalOpen,
        onboardPlaylistModalOpen,
        setOnboardPlaylistModalOpen,

        legalModalOpen,
        setLegalModalOpen,
        legalModalTab,
        openLegalModal,

        reportModalOpen,
        setReportModalOpen,
        reportTarget,
        openReportModal,
        submitAbuseReport,

        adminMetrics,
        pendingPlaylists,
        abuseReports,
        fetchAdminData,
        approveCuratorPlaylist,
        rejectCuratorPlaylist,
        resolveAbuseReport,
        refundSubmissionCredits,
        exportDatabaseBackup,

        artistTracks,
        addArtistTrack,

        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        clearAllNotifications,

        audioState,
        playTrack,
        pauseTrack,
        resumeTrack,
        stopAudio,
        seekAudio,
        setVolume,
        toggleMute,
        toggleEmbedExpanded,
        playSpotifyUrl,
        playNextTrack,
        playPreviousTrack,

        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
