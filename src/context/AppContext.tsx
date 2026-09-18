import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  UserProfile,
  UserRole,
  Playlist,
  Track,
  Submission,
  CreditTransaction,
  CuratorVerificationApplication,
  AppNotification,
  PitchType,
  SubmissionStatus,
  ActiveTab,
  EmailLog,
  CuratorActivityEvent,
  CuratorGatesConfig,
  ToastNotification,
  SpotifyParsedMetadata
} from '../types';
import { globalAudioEngine } from '../utils/audioEngine';
import { fetchSpotifyMetadata, convertSpotifyMetadataToTrack, parseSpotifyUrl } from '../utils/spotifyParser';
import confetti from 'canvas-confetti';
import {
  supabase,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  supabaseResetPassword,
  subscribeToRealtimeSubmissions,
  isSupabaseConfigured
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
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  addPlaylist: (playlist: Omit<Playlist, 'id' | 'curatorId' | 'curatorName' | 'curatorAvatar' | 'curatorSpotifyId' | 'approvalRate' | 'avgResponseHours' | 'isVerified'>) => Promise<Playlist | null>;
  togglePlaylistStatus: (id: string) => Promise<void>;

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
  purchaseCredits: (packageId: string, credits: number, priceUsd: number, paymentMethod?: string) => Promise<boolean>;
  freeWeeklyCredits: number;

  // Real-time Activity & Transactional Emails
  curatorActivities: CuratorActivityEvent[];
  emailLogs: EmailLog[];
  verifyGateAction: (playlistId: string, actionType: string) => Promise<boolean>;

  // Spotify OAuth
  connectSpotifyOAuth: () => Promise<void>;

  // Admin & Verification
  verificationApplications: CuratorVerificationApplication[];
  approveCuratorApplication: (id: string) => void;
  rejectCuratorApplication: (id: string, reason?: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Audio Engine & Spotify Playback
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

  // User tracks
  artistTracks: Track[];
  addArtistTrack: (track: Omit<Track, 'id'>) => void;

  // Real-time status ticker
  liveActiveCuratorsCount: number;
  recentLivePlacement: { artist: string; track: string; playlist: string; position: number } | null;
  isWsConnected: boolean;

  // Real-time toast notifications
  toasts: ToastNotification[];
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning', durationMs?: number) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('artist');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isWsConnected, setIsWsConnected] = useState(false);

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

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Check if user explicitly logged out previously
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('submitplug_logged_out') === 'true') {
        return null;
      }
      const savedUser = localStorage.getItem('submitplug_current_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {}
      }
    }
    return null; // Clean guest state by default
  });

  const isAuthenticated = Boolean(currentUser);

  // Core Data Lists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [curatorActivities, setCuratorActivities] = useState<CuratorActivityEvent[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);

  // Verification applications
  const [verificationApplications, setVerificationApplications] = useState<CuratorVerificationApplication[]>([]);

  // Modals state
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [selectedPlaylistForPitch, setSelectedPlaylistForPitch] = useState<Playlist | null>(null);
  const [spotifyWizardOpen, setSpotifyWizardOpen] = useState(false);
  const [buyCreditsModalOpen, setBuyCreditsModalOpen] = useState(false);
  const [onboardPlaylistModalOpen, setOnboardPlaylistModalOpen] = useState(false);

  const openSpotifyWizard = (playlist?: Playlist) => {
    if (playlist) {
      setSelectedPlaylistForPitch(playlist);
    }
    setSpotifyWizardOpen(true);
  };

  // Real-time ticker
  const [liveActiveCuratorsCount, setLiveActiveCuratorsCount] = useState(48);
  const [recentLivePlacement, setRecentLivePlacement] = useState<{
    artist: string;
    track: string;
    playlist: string;
    position: number;
  } | null>({
    artist: 'Velvet Echoes',
    track: 'Neon Horizon',
    playlist: 'Synthwave & Cyber Retrowave',
    position: 4
  });

  // Audio state with pre-configured Spotify featured track
  const [audioState, setAudioState] = useState<AudioState>({
    currentTrack: {
      id: 'spot_featured_1',
      title: 'Neon Horizon',
      artist: 'Velvet Echoes',
      albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80',
      spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
      previewUrl: '',
      durationSec: 214,
      genre: 'Synthwave',
      releaseDate: '2024'
    },
    isPlaying: false,
    currentTime: 0,
    duration: 214,
    playlistContext: 'Synthwave & Cyber Retrowave',
    activeSpotifyType: 'track',
    activeSpotifyId: '4cOdK2wGLETKBW3PvgPWqT',
    embedUrl: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator&theme=0',
    isEmbedExpanded: false,
    volume: 0.8,
    isMuted: false
  });

  // Global Toast Notifications
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
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
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

  // 1. Initial Load from Backend API
  const fetchAllInitialData = useCallback(async () => {
    try {
      // User Profile & Wallet with token if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('submitplug_token') : null;
      const userRes = await fetch('/api/auth/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setCurrentUser(userData.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('submitplug_current_user', JSON.stringify(userData.user));
          }
        } else if (!token) {
          setCurrentUser(null);
        }
      }

      // Playlists
      const plRes = await fetch('/api/playlists');
      if (plRes.ok) {
        const plData = await plRes.json();
        if (plData.playlists) {
          setPlaylists(plData.playlists);
        }
      }

      // Tracks Catalog
      const trkRes = await fetch('/api/tracks');
      if (trkRes.ok) {
        const trkData = await trkRes.json();
        if (trkData.tracks && trkData.tracks.length > 0) {
          setArtistTracks(trkData.tracks);
        }
      }

      // Submissions
      const subRes = await fetch('/api/submissions');
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.submissions) {
          setSubmissions(subData.submissions);
        }
      }

      // Wallet Transactions
      const txRes = await fetch('/api/wallet');
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.transactions) {
          setTransactions(txData.transactions);
        }
        if (txData.creditBalance !== undefined) {
          setCurrentUser(prev => ({
            ...prev,
            creditBalance: txData.creditBalance,
            freeWeeklyCredits: txData.freeWeeklyCredits
          }));
        }
      }

      // Live Curator Activities
      const actRes = await fetch('/api/activity');
      if (actRes.ok) {
        const actData = await actRes.json();
        if (actData.activities) {
          setCuratorActivities(actData.activities);
        }
      }

      // Email Logs
      const emlRes = await fetch('/api/emails');
      if (emlRes.ok) {
        const emlData = await emlRes.json();
        if (emlData.emails) {
          setEmailLogs(emlData.emails);
        }
      }
    } catch (err) {
      console.warn('[AppContext] Initial API fetch warning:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllInitialData();
  }, [fetchAllInitialData]);

  // 2. Real-Time WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[WebSocket] Real-time channel established');
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleRealtimeEvent(data);
          } catch (err) {
            console.error('[WebSocket] Failed to parse message:', err);
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          // Reconnect automatically
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[WebSocket] Error:', err);
          ws?.close();
        };
      } catch (err) {
        console.warn('[WebSocket] Connection failed:', err);
      }
    };

    connectWebSocket();

    // 3. Supabase Real-Time Channel Listener
    let supabaseChannel: any = null;
    try {
      supabaseChannel = supabase
        .channel('plug-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'playlists' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setPlaylists(prev => [payload.new as Playlist, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setPlaylists(prev => prev.map(p => (p.id === payload.new.id ? { ...p, ...payload.new } : p)));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setPlaylists(prev => prev.filter(p => p.id !== payload.old.id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.id === currentUser?.id) {
            setCurrentUser(prev => ({ ...prev, ...payload.new }));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setSubmissions(prev => [payload.new as Submission, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setSubmissions(prev => prev.map(s => (s.id === payload.new.id ? { ...s, ...payload.new } : s)));
          }
        })
        .subscribe();
    } catch (sbErr) {
      console.warn('[Supabase Real-Time] Channel subscription notice:', sbErr);
    }

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  // Handle incoming real-time events from server
  const handleRealtimeEvent = (msg: { type: string; payload: any }) => {
    const { type, payload } = msg;

    if (type === 'USER_UPDATED' && payload) {
      if (currentUser && payload.id === currentUser.id) {
        setCurrentUser(prev => (prev ? { ...prev, ...payload } : null));
      }
    }

    if (type === 'HEARTBEAT' && payload.onlineCurators) {
      setLiveActiveCuratorsCount(payload.onlineCurators);
    }

    if (type === 'SUBMISSION_CREATED' && payload.submission) {
      const newSub: Submission = payload.submission;
      setSubmissions(prev => {
        const exists = prev.some(s => s.id === newSub.id);
        if (exists) return prev;
        return [newSub, ...prev];
      });

      // Real-time toast broadcast to all active users
      showToast(
        '🎵 New Track Pitch Submitted',
        `${newSub.artistName} pitched "${newSub.track.title}" to ${newSub.playlistTitle}`,
        'info'
      );

      // If this was targeted to current curator or submitted by current artist
      if (currentUser && newSub.curatorId === currentUser.id) {
        setNotifications(prev => [
          {
            id: `notif_${Date.now()}`,
            userId: currentUser.id,
            title: 'New Track Pitch Received! 🎵',
            message: `${newSub.artistName} submitted "${newSub.track.title}" for ${newSub.playlistTitle}`,
            type: 'new_submission',
            createdAt: new Date().toISOString(),
            read: false,
            actionUrl: 'curator'
          },
          ...prev
        ]);
      }
    }

    if (type === 'SUBMISSION_UPDATED' && payload.submission) {
      const updatedSub: Submission = payload.submission;
      setSubmissions(prev =>
        prev.map(s => (s.id === updatedSub.id ? updatedSub : s))
      );

      // If approved, trigger live placement event and toast
      if (updatedSub.status === 'approved' || updatedSub.status === 'added_to_playlist') {
        setRecentLivePlacement({
          artist: updatedSub.artistName,
          track: updatedSub.track.title,
          playlist: updatedSub.playlistTitle,
          position: 4
        });

        showToast(
          '🚀 Track Placement Approved!',
          `"${updatedSub.track.title}" by ${updatedSub.artistName} was approved on "${updatedSub.playlistTitle}"!`,
          'success'
        );

        if (currentUser && updatedSub.artistId === currentUser.id) {
          try {
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.5 }
            });
          } catch {
            // safe catch
          }

          setNotifications(prev => [
            {
              id: `notif_${Date.now()}`,
              userId: currentUser.id,
              title: 'Song Added to Spotify Playlist! 🚀',
              message: `${updatedSub.curatorName} approved "${updatedSub.track.title}" for "${updatedSub.playlistTitle}"!`,
              type: 'placement_success',
              createdAt: new Date().toISOString(),
              read: false,
              actionUrl: 'artist'
            },
            ...prev
          ]);
        }
      } else if (updatedSub.status === 'declined') {
        if (currentUser && updatedSub.artistId === currentUser.id) {
          showToast(
            'Curator Review Completed',
            `Feedback has been provided for "${updatedSub.track.title}"`,
            'info'
          );
        }
      }
    }

    if (type === 'WALLET_UPDATED' && payload.wallet) {
      if (currentUser && (!payload.userId || payload.userId === currentUser.id)) {
        setCurrentUser(prev => (prev ? {
          ...prev,
          creditBalance: payload.wallet.creditBalance ?? prev.creditBalance,
          freeWeeklyCredits: payload.wallet.freeWeeklyCredits ?? prev.freeWeeklyCredits
        } : null));
        if (payload.wallet.transaction) {
          setTransactions(prev => [payload.wallet.transaction, ...prev]);
        }
      }
    }

    if (type === 'CURATOR_ACTIVITY') {
      setCuratorActivities(prev => [payload, ...prev.slice(0, 49)]);
    }

    if (type === 'TRACK_ADDED' && payload) {
      setArtistTracks(prev => {
        const exists = prev.some(t => t.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });
    }

    if (type === 'PLAYLIST_CREATED' && payload) {
      setPlaylists(prev => {
        const exists = prev.some(p => p.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });

      showToast(
        '🎧 New Spotify Playlist Live!',
        `"${payload.title}" by ${payload.curatorName} is now accepting pitches in real-time`,
        'success'
      );
    }

    if (type === 'PLAYLIST_UPDATED' && payload) {
      setPlaylists(prev => prev.map(p => (p.id === payload.id ? { ...p, ...payload } : p)));
      showToast(
        'Playlist Synchronized',
        `"${payload.title}" details updated in real-time`,
        'info'
      );
    }
  };

  // Supabase Realtime Subscription for Submissions Table
  useEffect(() => {
    const subChannel = subscribeToRealtimeSubmissions({
      onInsert: (newSub) => {
        setSubmissions(prev => {
          if (prev.some(s => s.id === newSub.id)) return prev;
          return [newSub, ...prev];
        });
        showToast(
          '⚡ Realtime Pitch Received',
          `"${newSub.track.title}" pitched to "${newSub.playlistTitle}"`,
          'info'
        );
      },
      onUpdate: (updatedSub) => {
        setSubmissions(prev => prev.map(s => (s.id === updatedSub.id ? updatedSub : s)));
        if (updatedSub.status === 'approved' || updatedSub.status === 'added_to_playlist') {
          showToast(
            '🚀 Placement Approved (Supabase Realtime)!',
            `"${updatedSub.track.title}" was approved on "${updatedSub.playlistTitle}"!`,
            'success'
          );
          try {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
          } catch {}
        }
      },
      onDelete: (id) => {
        setSubmissions(prev => prev.filter(s => s.id !== id));
      }
    });

    return () => {
      subChannel.unsubscribe();
    };
  }, [showToast]);

  // Auth Functions with Supabase Auth Integration
  const login = async (email: string, password = 'password123'): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Supabase Auth attempt
      const sbResult = await supabaseSignIn(email, password);
      if (!sbResult.success && isSupabaseConfigured) {
        return { success: false, error: sbResult.error };
      }

      // 2. Synchronize session with backend API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      setCurrentUser(data.user);
      setActiveRole(data.user.role || 'artist');
      if (typeof window !== 'undefined') {
        localStorage.setItem('submitplug_current_user', JSON.stringify(data.user));
        localStorage.setItem('submitplug_token', data.token || `token_${data.user.id}`);
        localStorage.setItem('submitplug_user_id', data.user.id);
        localStorage.removeItem('submitplug_logged_out');
      }
      setAuthModalOpen(false);

      try {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 } });
      } catch {}

      showToast(
        'Signed In Successfully',
        `Welcome back, ${data.user.name}! Supabase Auth session active.`,
        'success'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login network error' };
    }
  };

  const register = async (name: string, email: string, role: UserRole, password = 'password123'): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Supabase Auth registration
      const sbResult = await supabaseSignUp(name, email, password, role);
      if (!sbResult.success && isSupabaseConfigured) {
        return { success: false, error: sbResult.error };
      }

      // 2. Synchronize profile with backend API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, password })
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      setCurrentUser(data.user);
      setActiveRole(role);
      if (typeof window !== 'undefined') {
        localStorage.setItem('submitplug_current_user', JSON.stringify(data.user));
        localStorage.setItem('submitplug_token', data.token || `token_${data.user.id}`);
        localStorage.setItem('submitplug_user_id', data.user.id);
        localStorage.removeItem('submitplug_logged_out');
      }
      setAuthModalOpen(false);

      try {
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.5 } });
      } catch {}

      showToast(
        'Account Registered!',
        `Welcome to Playlist Plug, ${data.user.name}! Supabase user account created.`,
        'success'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration network error' };
    }
  };

  const logout = async () => {
    await supabaseSignOut();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('submitplug_current_user');
      localStorage.removeItem('submitplug_token');
      localStorage.removeItem('submitplug_user_id');
      localStorage.setItem('submitplug_logged_out', 'true');
    }
    setCurrentUser(null);
    showToast('Signed Out', 'You have been safely signed out.', 'info');
    if (activeTab === 'curator' || activeTab === 'profile' || activeTab === 'dashboard') {
      setActiveTab('home');
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    return await supabaseResetPassword(email);
  };

  // Switch role helper
  const switchUserRole = (role: UserRole) => {
    setActiveRole(role);
    if (currentUser) {
      setCurrentUser(prev => (prev ? { ...prev, role } : null));
    }
    if (role === 'artist') setActiveTab('artist');
    else if (role === 'curator') setActiveTab('curator');
    else if (role === 'admin') setActiveTab('profile');
  };

  // Update profile via API
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id, ...updates })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.warn('[AppContext] Profile update error:', err);
      setCurrentUser(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Submit pitch via real API
  const submitPitch = async (
    arg1: any,
    arg2?: string,
    arg3?: PitchType,
    arg4?: string
  ): Promise<{ success: boolean; message: string; submission?: Submission; error?: string }> => {
    if (!currentUser) {
      openLoginModal();
      return { success: false, message: 'Please sign in to pitch your music.' };
    }

    let track: Track;
    let playlistId: string;
    let pitchType: PitchType;
    let customMessage: string | undefined;
    let gateActionsCompleted: any;

    if (arg1 && typeof arg1 === 'object' && 'track' in arg1) {
      track = arg1.track;
      playlistId = arg1.playlistId;
      pitchType = arg1.pitchType || 'premium';
      customMessage = arg1.customMessage;
      gateActionsCompleted = arg1.gateActionsCompleted;
    } else {
      track = arg1;
      playlistId = arg2!;
      pitchType = arg3 || 'premium';
      customMessage = arg4;
    }

    const targetPlaylist = playlists.find(p => p.id === playlistId);
    if (!targetPlaylist) {
      return { success: false, message: 'Target playlist not found' };
    }

    const isFree = pitchType === 'free';
    const cost = isFree ? 0 : (targetPlaylist.pitchCostCredits || 1);

    if (isFree && (currentUser.freeWeeklyCredits || 0) < 1) {
      setBuyCreditsModalOpen(true);
      return { success: false, message: 'No free weekly pitches remaining. Top up your wallet to pitch.' };
    }

    if (!isFree && currentUser.creditBalance < cost) {
      setBuyCreditsModalOpen(true);
      return { success: false, message: 'Insufficient credits. Please top up your wallet.' };
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: currentUser.id,
          playlistId: playlistId,
          track: track,
          pitchType: pitchType,
          customMessage: customMessage,
          gateActionsCompleted: gateActionsCompleted || {
            followedCurator: true,
            followedPlaylist: true,
            savedSong: false
          }
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        return { success: false, message: resData.error || 'Submission failed', error: resData.error };
      }

      // Update local wallet directly from server response
      if (resData.wallet) {
        setCurrentUser(prev => (prev ? {
          ...prev,
          creditBalance: resData.wallet.creditBalance ?? prev.creditBalance,
          freeWeeklyCredits: resData.wallet.freeWeeklyCredits ?? prev.freeWeeklyCredits,
          totalSubmissions: prev.totalSubmissions + 1
        } : null));
      }

      if (resData.submission) {
        setSubmissions(prev => {
          const exists = prev.some(s => s.id === resData.submission.id);
          if (exists) return prev;
          return [resData.submission, ...prev];
        });
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe catch
      }

      return {
        success: true,
        message: `Successfully pitched "${track.title}" to ${targetPlaylist.title}! Curator notified in real-time.`,
        submission: resData.submission
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error submitting pitch', error: err.message };
    }
  };

  // Review submission via real API
  const reviewSubmission = async (
    submissionId: string,
    action: 'approve' | 'decline',
    feedbackTags: string[],
    feedbackNote?: string,
    spotifyPlacementUrl?: string
  ) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          feedbackTags,
          feedbackNote,
          spotifyPlacementUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.submission) {
          setSubmissions(prev =>
            prev.map(s => (s.id === submissionId ? data.submission : s))
          );
        }
      }
    } catch (err) {
      console.error('[AppContext] Review submission error:', err);
    }
  };

  // Purchase credits via real API
  const purchaseCredits = async (
    packageId: string,
    credits: number,
    priceUsd: number,
    paymentMethod = 'card'
  ): Promise<boolean> => {
    if (!currentUser) {
      openLoginModal();
      return false;
    }
    try {
      const response = await fetch('/api/payments/instant-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          userId: currentUser.id,
          paymentMethod
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(prev => (prev ? {
          ...prev,
          creditBalance: data.newBalance
        } : null));

        if (data.transaction) {
          setTransactions(prev => [data.transaction, ...prev]);
        }

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.4 }
          });
        } catch {
          // safe catch
        }

        return true;
      }
      return false;
    } catch (err) {
      console.error('[AppContext] Top up failed:', err);
      return false;
    }
  };

  // Connect Spotify OAuth (Popup Flow adhering to OAuth Skill)
  const connectSpotifyOAuth = async () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    const targetUserId = currentUser.id;
    try {
      const res = await fetch(`/api/auth/spotify/url?userId=${targetUserId}`);
      const data = await res.json();

      if (data.url) {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.url,
          'Spotify Authorization',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=1`
        );

        // Listen for message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'OAUTH_AUTH_SUCCESS') {
            console.log('[Spotify OAuth] Success message received from popup:', event.data);
            window.removeEventListener('message', handleMessage);

            if (event.data.user) {
              setCurrentUser(prev => (prev ? {
                ...prev,
                ...event.data.user,
                verifiedStatus: true
              } : null));
            } else {
              setCurrentUser(prev => (prev ? {
                ...prev,
                spotifyId: 'spotify_verified_user',
                verifiedStatus: true
              } : null));
            }

            try {
              confetti({ particleCount: 70, spread: 50, origin: { y: 0.5 } });
            } catch {
              // safe catch
            }
          }
        };

        window.addEventListener('message', handleMessage);
      }
    } catch (err) {
      console.error('[AppContext] Spotify OAuth failed:', err);
    }
  };

  // Verify Gate Action
  const verifyGateAction = async (playlistId: string, actionType: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/activity/verify-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_guest',
          playlistId,
          actionType
        })
      });
      return res.ok;
    } catch {
      return true;
    }
  };

  // Add curator playlist
  const addPlaylist = async (playlistData: Omit<Playlist, 'id' | 'curatorId' | 'curatorName' | 'curatorAvatar' | 'curatorSpotifyId' | 'approvalRate' | 'avgResponseHours' | 'isVerified'>) => {
    if (!currentUser) {
      openLoginModal();
      return null;
    }
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...playlistData,
          curatorId: currentUser.id,
          curatorName: currentUser.name,
          curatorAvatar: currentUser.avatarUrl,
          curatorSpotifyId: currentUser.spotifyId || 'curator_spotify'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.playlist) {
          setPlaylists(prev => {
            const exists = prev.some(p => p.id === data.playlist.id);
            if (exists) return prev;
            return [data.playlist, ...prev];
          });
          return data.playlist;
        }
      }
    } catch (err) {
      console.error('[AppContext] Add playlist error:', err);
    }
    return null;
  };

  const togglePlaylistStatus = async (id: string) => {
    const target = playlists.find(p => p.id === id);
    if (!target) return;
    const newStatus = !target.acceptingSubmissions;

    try {
      await fetch(`/api/playlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingSubmissions: newStatus })
      });
      setPlaylists(prev =>
        prev.map(p => (p.id === id ? { ...p, acceptingSubmissions: newStatus } : p))
      );
    } catch (err) {
      console.error('[AppContext] Toggle status failed:', err);
    }
  };

  // Audio Controls & Spotify Playback Engine
  const playTrack = useCallback((track: Track, playlistContext?: string) => {
    const parsed = parseSpotifyUrl(track.spotifyUrl || track.spotifyUri);
    const spotifyId = parsed?.id || (track.id.startsWith('spot_') ? track.id.replace('spot_', '') : undefined);
    const spotifyType = parsed?.type || 'track';
    const embedUrl = parsed?.embedUrl || (spotifyId ? `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0` : undefined);

    setAudioState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: track.durationSec || 180,
      playlistContext: playlistContext || prev.playlistContext,
      activeSpotifyId: spotifyId,
      activeSpotifyType: spotifyType,
      embedUrl
    }));

    globalAudioEngine.playTrack(
      track,
      (current, duration) => {
        setAudioState(prev => ({
          ...prev,
          currentTime: current,
          duration: duration || track.durationSec || 180
        }));
      },
      () => {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0
        }));
      }
    );
  }, []);

  const pauseTrack = useCallback(() => {
    globalAudioEngine.stop();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const resumeTrack = useCallback(() => {
    if (audioState.currentTrack) {
      playTrack(audioState.currentTrack, audioState.playlistContext);
    }
  }, [audioState.currentTrack, audioState.playlistContext, playTrack]);

  const stopAudio = useCallback(() => {
    globalAudioEngine.stop();
    setAudioState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0
    }));
  }, []);

  const seekAudio = useCallback((seconds: number) => {
    globalAudioEngine.seek(seconds);
    setAudioState(prev => ({ ...prev, currentTime: seconds }));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    globalAudioEngine.setVolume(clamped);
    setAudioState(prev => ({ ...prev, volume: clamped, isMuted: clamped === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    setAudioState(prev => {
      const willMute = !prev.isMuted;
      globalAudioEngine.setVolume(willMute ? 0 : (prev.volume ?? 0.8));
      return { ...prev, isMuted: willMute };
    });
  }, []);

  const toggleEmbedExpanded = useCallback(() => {
    setAudioState(prev => ({ ...prev, isEmbedExpanded: !prev.isEmbedExpanded }));
  }, []);

  // Play Spotify URL or URI directly with automatic metadata parsing
  const playSpotifyUrl = useCallback(async (urlOrUri: string, contextTitle?: string): Promise<boolean> => {
    try {
      showToast('Parsing Spotify Link...', 'Retrieving high-res cover art & metadata...', 'info', 2000);
      const meta = await fetchSpotifyMetadata(urlOrUri);
      if (!meta) {
        showToast('Invalid Spotify URL', 'Could not detect a valid Spotify track, album, or playlist link.', 'error');
        return false;
      }

      const track = convertSpotifyMetadataToTrack(meta);
      playTrack(track, contextTitle || (meta.type === 'playlist' ? `Playlist: ${meta.title}` : `Spotify ${meta.type.toUpperCase()}`));

      setAudioState(prev => ({
        ...prev,
        activeSpotifyId: meta.id,
        activeSpotifyType: meta.type,
        embedUrl: meta.embedUrl,
        parsedMetadata: meta
      }));

      showToast(
        'Now Playing on Spotify',
        `"${meta.title}" by ${meta.artist} loaded into sticky footer player`,
        'success'
      );
      return true;
    } catch (err: any) {
      showToast('Playback Error', err.message || 'Failed to parse Spotify link', 'error');
      return false;
    }
  }, [playTrack, showToast]);

  // Queue cycling: Next & Previous
  const getAllAvailableTracks = useCallback((): Track[] => {
    const tracks: Track[] = [];
    const seen = new Set<string>();

    // From user tracks
    artistTracks.forEach(t => {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        tracks.push(t);
      }
    });

    // From playlists
    playlists.forEach(p => {
      if (p.spotlightTrack && !seen.has(p.spotlightTrack.id)) {
        seen.add(p.spotlightTrack.id);
        tracks.push(p.spotlightTrack);
      }
      p.recentAddedTracks?.forEach(t => {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          tracks.push(t);
        }
      });
    });

    return tracks;
  }, [artistTracks, playlists]);

  const playNextTrack = useCallback(() => {
    const all = getAllAvailableTracks();
    if (all.length === 0) return;
    const currentId = audioState.currentTrack?.id;
    const currentIndex = all.findIndex(t => t.id === currentId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % all.length;
    playTrack(all[nextIndex]);
  }, [getAllAvailableTracks, audioState.currentTrack?.id, playTrack]);

  const playPreviousTrack = useCallback(() => {
    const all = getAllAvailableTracks();
    if (all.length === 0) return;
    const currentId = audioState.currentTrack?.id;
    const currentIndex = all.findIndex(t => t.id === currentId);
    const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + all.length) % all.length;
    playTrack(all[prevIndex]);
  }, [getAllAvailableTracks, audioState.currentTrack?.id, playTrack]);

  // Modals
  const openPitchModal = (playlist?: Playlist) => {
    if (playlist) {
      setSelectedPlaylistForPitch(playlist);
    }
    setPitchModalOpen(true);
  };

  const closePitchModal = () => {
    setPitchModalOpen(false);
    setSelectedPlaylistForPitch(null);
  };

  const addArtistTrack = async (trackData: Omit<Track, 'id'>) => {
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.track) {
          setArtistTracks(prev => [data.track, ...prev]);
          showToast('Track Saved', `"${data.track.title}" is ready for pitching.`, 'success');
          return;
        }
      }
    } catch (err) {
      console.warn('Track saving error:', err);
    }
    const newTrack: Track = {
      ...trackData,
      id: `trk_${Date.now()}`,
      playCount: Math.floor(Math.random() * 8000) + 1200
    };
    setArtistTracks(prev => [newTrack, ...prev]);
  };

  const approveCuratorApplication = (id: string) => {
    setVerificationApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'approved' } : app))
    );
  };

  const rejectCuratorApplication = (id: string, reason?: string) => {
    setVerificationApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'rejected', reviewNotes: reason } : app))
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const userPlaylists = playlists.filter(p => currentUser && p.curatorId === currentUser.id);
  const artistSubmissions = submissions.filter(s => currentUser && s.artistId === currentUser.id);
  const curatorInboxSubmissions = submissions.filter(s => currentUser && s.curatorId === currentUser.id);
  const unreadNotificationCount = currentUser ? notifications.filter(n => !n.read && n.userId === currentUser.id).length : 0;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        register,
        logout,
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
        submissions,
        artistSubmissions,
        curatorInboxSubmissions,
        submitPitch,
        reviewSubmission,
        transactions,
        purchaseCredits,
        freeWeeklyCredits: currentUser?.freeWeeklyCredits || 0,
        curatorActivities,
        emailLogs,
        verifyGateAction,
        connectSpotifyOAuth,
        verificationApplications,
        approveCuratorApplication,
        rejectCuratorApplication,
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
        pitchModalOpen,
        selectedPlaylistForPitch,
        openPitchModal,
        closePitchModal,
        spotifyWizardOpen,
        setSpotifyWizardOpen,
        openSpotifyWizard,
        buyCreditsModalOpen,
        setBuyCreditsModalOpen,
        onboardPlaylistModalOpen,
        setOnboardPlaylistModalOpen,
        artistTracks,
        addArtistTrack,
        liveActiveCuratorsCount,
        recentLivePlacement,
        isWsConnected,
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
