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
  CuratorGatesConfig
} from '../types';
import { globalAudioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playlistContext?: string;
}

interface AppContextType {
  currentUser: UserProfile;
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
  submitPitch: (data: {
    track: Track;
    playlistId: string;
    pitchType: PitchType;
    customMessage?: string;
    spotlightDuration?: number;
    gateActionsCompleted?: {
      followedCurator?: boolean;
      followedPlaylist?: boolean;
      savedSong?: boolean;
    };
  }) => Promise<{ success: boolean; message: string }>;
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

  // Audio Engine
  audioState: AudioState;
  playTrack: (track: Track, playlistContext?: string) => void;
  pauseTrack: () => void;
  stopAudio: () => void;

  // Modals
  pitchModalOpen: boolean;
  selectedPlaylistForPitch: Playlist | null;
  openPitchModal: (playlist?: Playlist) => void;
  closePitchModal: () => void;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('artist');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isWsConnected, setIsWsConnected] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr_sanelow_1',
    name: 'Sane Low Label',
    email: 'SanelowLabel@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
    role: 'artist',
    spotifyId: 'sanelowlabel',
    spotifyUri: 'https://open.spotify.com/user/sanelowlabel',
    spotifyFollowers: 85400,
    bio: 'Official Sane Low Label Hub. Direct Spotify playlist curation, organic artist pitching, and global sound discovery.',
    creditBalance: 25,
    freeWeeklyCredits: 2,
    verifiedStatus: true,
    totalSubmissions: 12,
    totalPlacements: 8,
    createdAt: new Date().toISOString()
  });

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
  const [buyCreditsModalOpen, setBuyCreditsModalOpen] = useState(false);
  const [onboardPlaylistModalOpen, setOnboardPlaylistModalOpen] = useState(false);

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

  // Audio state
  const [audioState, setAudioState] = useState<AudioState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 30,
    playlistContext: undefined
  });

  // 1. Initial Load from Backend API
  const fetchAllInitialData = useCallback(async () => {
    try {
      // User Profile & Wallet
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setCurrentUser(userData.user);
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
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.id === currentUser.id) {
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
      if (payload.id === currentUser.id) {
        setCurrentUser(prev => ({ ...prev, ...payload }));
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

      // If this was targeted to current curator or submitted by current artist
      if (newSub.curatorId === currentUser.id) {
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

        if (updatedSub.artistId === currentUser.id) {
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
      }
    }

    if (type === 'WALLET_UPDATED' && payload.wallet) {
      if (!payload.userId || payload.userId === currentUser.id) {
        setCurrentUser(prev => ({
          ...prev,
          creditBalance: payload.wallet.creditBalance ?? prev.creditBalance,
          freeWeeklyCredits: payload.wallet.freeWeeklyCredits ?? prev.freeWeeklyCredits
        }));
        if (payload.wallet.transaction) {
          setTransactions(prev => [payload.wallet.transaction, ...prev]);
        }
      }
    }

    if (type === 'CURATOR_ACTIVITY') {
      setCuratorActivities(prev => [payload, ...prev.slice(0, 49)]);
    }

    if (type === 'PLAYLIST_CREATED') {
      setPlaylists(prev => [payload, ...prev]);
    }

    if (type === 'PLAYLIST_UPDATED') {
      setPlaylists(prev => prev.map(p => (p.id === payload.id ? payload : p)));
    }
  };

  // Switch role helper
  const switchUserRole = (role: UserRole) => {
    setActiveRole(role);
    setCurrentUser(prev => ({ ...prev, role }));
    if (role === 'artist') setActiveTab('artist');
    else if (role === 'curator') setActiveTab('curator');
    else if (role === 'admin') setActiveTab('profile');
  };

  // Update profile via API
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
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
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  // Submit pitch via real API
  const submitPitch = async (data: {
    track: Track;
    playlistId: string;
    pitchType: PitchType;
    customMessage?: string;
    spotlightDuration?: number;
    gateActionsCompleted?: {
      followedCurator?: boolean;
      followedPlaylist?: boolean;
      savedSong?: boolean;
    };
  }): Promise<{ success: boolean; message: string }> => {
    const targetPlaylist = playlists.find(p => p.id === data.playlistId);
    if (!targetPlaylist) {
      return { success: false, message: 'Target playlist not found' };
    }

    const isFree = data.pitchType === 'free';
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
          playlistId: data.playlistId,
          track: data.track,
          pitchType: data.pitchType,
          customMessage: data.customMessage,
          gateActionsCompleted: data.gateActionsCompleted || {
            followedCurator: true,
            followedPlaylist: true,
            savedSong: false
          }
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        return { success: false, message: resData.error || 'Submission failed' };
      }

      // Update local wallet directly from server response
      if (resData.wallet) {
        setCurrentUser(prev => ({
          ...prev,
          creditBalance: resData.wallet.creditBalance ?? prev.creditBalance,
          freeWeeklyCredits: resData.wallet.freeWeeklyCredits ?? prev.freeWeeklyCredits,
          totalSubmissions: prev.totalSubmissions + 1
        }));
      }

      if (resData.submission) {
        setSubmissions(prev => [resData.submission, ...prev]);
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
        message: `Successfully pitched "${data.track.title}" to ${targetPlaylist.title}! Curator notified in real-time.`
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error submitting pitch' };
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
        setCurrentUser(prev => ({
          ...prev,
          creditBalance: data.newBalance
        }));

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
    try {
      const res = await fetch(`/api/auth/spotify/url?userId=${currentUser.id}`);
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
              setCurrentUser(prev => ({
                ...prev,
                ...event.data.user,
                verifiedStatus: true
              }));
            } else {
              setCurrentUser(prev => ({
                ...prev,
                spotifyId: 'spotify_verified_user',
                verifiedStatus: true
              }));
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
          userId: currentUser.id,
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
          setPlaylists(prev => [data.playlist, ...prev]);
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

  // Audio Controls
  const playTrack = (track: Track, playlistContext?: string) => {
    setAudioState({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: 30,
      playlistContext
    });

    globalAudioEngine.playTrack(
      track,
      (current, duration) => {
        setAudioState(prev => ({
          ...prev,
          currentTime: current,
          duration: duration || 30
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
  };

  const pauseTrack = () => {
    globalAudioEngine.stop();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  };

  const stopAudio = () => {
    globalAudioEngine.stop();
    setAudioState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 30,
      playlistContext: undefined
    });
  };

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

  const addArtistTrack = (trackData: Omit<Track, 'id'>) => {
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

  const userPlaylists = playlists.filter(p => p.curatorId === currentUser.id);
  const artistSubmissions = submissions.filter(s => s.artistId === currentUser.id);
  const curatorInboxSubmissions = submissions.filter(s => s.curatorId === currentUser.id || s.curatorId === 'usr_curator_1');
  const unreadNotificationCount = notifications.filter(n => !n.read && n.userId === currentUser.id).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
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
        freeWeeklyCredits: currentUser.freeWeeklyCredits || 0,
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
        stopAudio,
        pitchModalOpen,
        selectedPlaylistForPitch,
        openPitchModal,
        closePitchModal,
        buyCreditsModalOpen,
        setBuyCreditsModalOpen,
        onboardPlaylistModalOpen,
        setOnboardPlaylistModalOpen,
        artistTracks,
        addArtistTrack,
        liveActiveCuratorsCount,
        recentLivePlacement,
        isWsConnected
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
