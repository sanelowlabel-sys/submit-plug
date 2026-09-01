import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  ActiveTab
} from '../types';
import {
  INITIAL_ARTIST,
  INITIAL_CURATOR,
  INITIAL_ADMIN,
  INITIAL_PLAYLISTS,
  INITIAL_SUBMISSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_VERIFICATIONS,
  INITIAL_NOTIFICATIONS,
  DEMO_TRACKS
} from '../data/mockData';
import { globalAudioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';

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
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Playlists
  playlists: Playlist[];
  userPlaylists: Playlist[];
  addPlaylist: (playlist: Omit<Playlist, 'id' | 'curatorId' | 'curatorName' | 'curatorAvatar' | 'curatorSpotifyId' | 'approvalRate' | 'avgResponseHours' | 'isVerified'>) => void;
  togglePlaylistStatus: (id: string) => void;

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
  }) => Promise<{ success: boolean; message: string }>;
  reviewSubmission: (submissionId: string, action: 'approve' | 'decline', feedbackTags: string[], feedbackNote?: string) => void;

  // Credits & Wallet
  transactions: CreditTransaction[];
  purchaseCredits: (packageId: string, credits: number, priceUsd: number) => Promise<boolean>;
  
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('artist');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  
  // Users state with local storage cache
  const [artistUser, setArtistUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('submitplug_artist');
    return saved ? JSON.parse(saved) : INITIAL_ARTIST;
  });
  const [curatorUser, setCuratorUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('submitplug_curator');
    return saved ? JSON.parse(saved) : INITIAL_CURATOR;
  });
  const [adminUser, setAdminUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('submitplug_admin');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN;
  });

  const currentUser = activeRole === 'artist' ? artistUser : activeRole === 'curator' ? curatorUser : adminUser;

  // Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('submitplug_playlists');
    return saved ? JSON.parse(saved) : INITIAL_PLAYLISTS;
  });

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('submitplug_submissions');
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  // Transactions state
  const [transactions, setTransactions] = useState<CreditTransaction[]>(() => {
    const saved = localStorage.getItem('submitplug_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Verification applications
  const [verificationApplications, setVerificationApplications] = useState<CuratorVerificationApplication[]>(() => {
    const saved = localStorage.getItem('submitplug_verifications');
    return saved ? JSON.parse(saved) : INITIAL_VERIFICATIONS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('submitplug_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Tracks
  const [artistTracks, setArtistTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('submitplug_artist_tracks');
    return saved ? JSON.parse(saved) : DEMO_TRACKS;
  });

  // Modals state
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [selectedPlaylistForPitch, setSelectedPlaylistForPitch] = useState<Playlist | null>(null);
  const [buyCreditsModalOpen, setBuyCreditsModalOpen] = useState(false);
  const [onboardPlaylistModalOpen, setOnboardPlaylistModalOpen] = useState(false);

  // Real-time live ticker state
  const [liveActiveCuratorsCount, setLiveActiveCuratorsCount] = useState(4280);
  const [recentLivePlacement, setRecentLivePlacement] = useState<{
    artist: string;
    track: string;
    playlist: string;
    position: number;
  }>({
    artist: 'Alex Vance',
    track: 'Neon Horizons',
    playlist: 'Deep House & Sunset Grooves',
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

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('submitplug_artist', JSON.stringify(artistUser));
  }, [artistUser]);
  useEffect(() => {
    localStorage.setItem('submitplug_curator', JSON.stringify(curatorUser));
  }, [curatorUser]);
  useEffect(() => {
    localStorage.setItem('submitplug_admin', JSON.stringify(adminUser));
  }, [adminUser]);
  useEffect(() => {
    localStorage.setItem('submitplug_playlists', JSON.stringify(playlists));
  }, [playlists]);
  useEffect(() => {
    localStorage.setItem('submitplug_submissions', JSON.stringify(submissions));
  }, [submissions]);
  useEffect(() => {
    localStorage.setItem('submitplug_transactions', JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem('submitplug_verifications', JSON.stringify(verificationApplications));
  }, [verificationApplications]);
  useEffect(() => {
    localStorage.setItem('submitplug_notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('submitplug_artist_tracks', JSON.stringify(artistTracks));
  }, [artistTracks]);

  // Real-time simulated heartbeats & live placement events
  useEffect(() => {
    const interval = setInterval(() => {
      // Small live variation in active curator counter
      setLiveActiveCuratorsCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));

      // 20% chance of random live placement update event
      if (Math.random() < 0.3) {
        const demoArtists = ['Kavinsky Sound', 'Luna Echo', 'Maxence Ray', 'Aura Noir', 'Sloane Miller', 'Deep Resonance'];
        const demoTracks = ['Afterdark Wave', 'Velvet Groove', 'Solar Flares', 'Midnight Echo', 'Golden Mirage'];
        const demoPlaylists = ['Deep House & Sunset Grooves', 'Melodic Techno & Afterlife', 'Lo-Fi Study Beats', 'Indie Dream Pop Picks'];
        
        const randomArtist = demoArtists[Math.floor(Math.random() * demoArtists.length)];
        const randomTrack = demoTracks[Math.floor(Math.random() * demoTracks.length)];
        const randomPl = demoPlaylists[Math.floor(Math.random() * demoPlaylists.length)];
        const randomPos = Math.floor(Math.random() * 8) + 1;

        setRecentLivePlacement({
          artist: randomArtist,
          track: randomTrack,
          playlist: randomPl,
          position: randomPos
        });
      }
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const switchUserRole = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'artist') setActiveTab('artist');
    else if (role === 'curator') setActiveTab('curator');
    else if (role === 'admin') setActiveTab('profile');
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (activeRole === 'artist') {
      setArtistUser(prev => ({ ...prev, ...updates }));
    } else if (activeRole === 'curator') {
      setCuratorUser(prev => ({ ...prev, ...updates }));
    } else {
      setAdminUser(prev => ({ ...prev, ...updates }));
    }
  };

  const userPlaylists = playlists.filter(p => p.curatorId === curatorUser.id);
  const artistSubmissions = submissions.filter(s => s.artistId === artistUser.id);
  const curatorInboxSubmissions = submissions.filter(s => s.curatorId === curatorUser.id);

  const unreadNotificationCount = notifications.filter(n => !n.read && n.userId === currentUser.id).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
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

  // Pitch submission
  const submitPitch = async (data: {
    track: Track;
    playlistId: string;
    pitchType: PitchType;
    customMessage?: string;
    spotlightDuration?: number;
  }): Promise<{ success: boolean; message: string }> => {
    const targetPlaylist = playlists.find(p => p.id === data.playlistId);
    if (!targetPlaylist) {
      return { success: false, message: 'Target playlist not found' };
    }

    const cost = data.pitchType === 'premium' ? targetPlaylist.pitchCostCredits : 0;

    if (data.pitchType === 'premium' && artistUser.creditBalance < cost) {
      setBuyCreditsModalOpen(true);
      return { success: false, message: 'Insufficient credits. Please top up your wallet.' };
    }

    // Deduct credit if premium
    if (data.pitchType === 'premium') {
      setArtistUser(prev => ({
        ...prev,
        creditBalance: prev.creditBalance - cost,
        totalSubmissions: prev.totalSubmissions + 1
      }));

      const newTx: CreditTransaction = {
        id: `tx_${Date.now()}`,
        userId: artistUser.id,
        userName: artistUser.name,
        amount: -cost,
        type: 'premium_pitch',
        description: `Premium pitch of "${data.track.title}" to ${targetPlaylist.title}`,
        createdAt: new Date().toISOString(),
        status: 'completed'
      };
      setTransactions(prev => [newTx, ...prev]);
    } else {
      setArtistUser(prev => ({
        ...prev,
        totalSubmissions: prev.totalSubmissions + 1
      }));
    }

    const newSubmission: Submission = {
      id: `sub_${Date.now()}`,
      track: data.track,
      playlistId: targetPlaylist.id,
      playlistTitle: targetPlaylist.title,
      playlistCover: targetPlaylist.coverArt,
      curatorId: targetPlaylist.curatorId,
      curatorName: targetPlaylist.curatorName,
      artistId: artistUser.id,
      artistName: artistUser.name,
      artistAvatar: artistUser.avatarUrl,
      pitchType: data.pitchType,
      pitchCost: cost,
      customMessage: data.customMessage,
      status: 'pending',
      feedbackTags: [],
      submittedAt: new Date().toISOString(),
      spotlightListenedDuration: data.spotlightDuration || (data.pitchType === 'free' ? 30 : undefined)
    };

    setSubmissions(prev => [newSubmission, ...prev]);

    // Send notification to curator in real time
    const curatorNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: targetPlaylist.curatorId,
      title: `New ${data.pitchType === 'premium' ? 'Premium ⭐' : 'Free'} Pitch Received`,
      message: `${artistUser.name} submitted "${data.track.title}" for ${targetPlaylist.title}.`,
      type: 'new_submission',
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: 'curator'
    };
    setNotifications(prev => [curatorNotif, ...prev]);

    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Safe catch
    }

    return { success: true, message: `Pitch successfully submitted to ${targetPlaylist.title}!` };
  };

  // Review submission
  const reviewSubmission = (
    submissionId: string,
    action: 'approve' | 'decline',
    feedbackTags: string[],
    feedbackNote?: string
  ) => {
    const targetSub = submissions.find(s => s.id === submissionId);
    if (!targetSub) return;

    const newStatus: SubmissionStatus = action === 'approve' ? 'added_to_playlist' : 'declined';
    const reviewedAt = new Date().toISOString();

    setSubmissions(prev =>
      prev.map(s => {
        if (s.id === submissionId) {
          return {
            ...s,
            status: newStatus,
            reviewedAt,
            feedbackTags,
            feedbackNote,
            spotifyPlacementUrl: action === 'approve' ? `https://open.spotify.com/playlist/${s.playlistId}` : undefined
          };
        }
        return s;
      })
    );

    // If approved, update playlist track count and add to recent tracks
    if (action === 'approve') {
      setPlaylists(prev =>
        prev.map(p => {
          if (p.id === targetSub.playlistId) {
            return {
              ...p,
              trackCount: p.trackCount + 1,
              recentAddedTracks: [targetSub.track, ...(p.recentAddedTracks || [])].slice(0, 5)
            };
          }
          return p;
        })
      );

      // Reward curator if premium review
      if (targetSub.pitchType === 'premium') {
        setCuratorUser(prev => ({
          ...prev,
          earningsBalance: prev.earningsBalance + 1.25,
          totalPlacements: prev.totalPlacements + 1
        }));

        const curatorRewardTx: CreditTransaction = {
          id: `tx_${Date.now()}`,
          userId: curatorUser.id,
          userName: curatorUser.name,
          amount: 1.25,
          type: 'curator_reward',
          description: `Curator placement payout for "${targetSub.track.title}" review`,
          createdAt: reviewedAt,
          status: 'completed'
        };
        setTransactions(prev => [curatorRewardTx, ...prev]);
      }

      // Notify artist in real time
      const artistNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: targetSub.artistId,
        title: 'Song Added to Spotify Playlist! 🚀',
        message: `${targetSub.curatorName} approved "${targetSub.track.title}" for ${targetSub.playlistTitle}!`,
        type: 'placement_success',
        createdAt: reviewedAt,
        read: false,
        actionUrl: 'artist'
      };
      setNotifications(prev => [artistNotif, ...prev]);

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.5 }
        });
      } catch {
        // Safe catch
      }
    } else {
      // Declined with feedback
      if (targetSub.pitchType === 'premium') {
        setCuratorUser(prev => ({
          ...prev,
          earningsBalance: prev.earningsBalance + 0.85
        }));
      }

      // Notify artist with feedback
      const artistNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: targetSub.artistId,
        title: 'Review Feedback Received',
        message: `${targetSub.curatorName} reviewed "${targetSub.track.title}" with constructive tags.`,
        type: 'pitch_declined',
        createdAt: reviewedAt,
        read: false,
        actionUrl: 'artist'
      };
      setNotifications(prev => [artistNotif, ...prev]);
    }
  };

  // Purchase credits
  const purchaseCredits = async (_packageId: string, credits: number, priceUsd: number): Promise<boolean> => {
    setArtistUser(prev => ({
      ...prev,
      creditBalance: prev.creditBalance + credits
    }));

    const tx: CreditTransaction = {
      id: `tx_${Date.now()}`,
      userId: artistUser.id,
      userName: artistUser.name,
      amount: credits,
      type: 'purchase',
      description: `Purchased Credit Bundle (+${credits} Credits)`,
      createdAt: new Date().toISOString(),
      status: 'completed',
      stripeAmountUsd: priceUsd
    };

    setTransactions(prev => [tx, ...prev]);

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: artistUser.id,
      title: 'Credits Added Successfully 💳',
      message: `+${credits} Submit Plug credits have been deposited to your wallet.`,
      type: 'credits_added',
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: 'artist'
    };
    setNotifications(prev => [notif, ...prev]);

    try {
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.4 }
      });
    } catch {
      // Safe catch
    }

    return true;
  };

  // Curator add playlist
  const addPlaylist = (playlistData: Omit<Playlist, 'id' | 'curatorId' | 'curatorName' | 'curatorAvatar' | 'curatorSpotifyId' | 'approvalRate' | 'avgResponseHours' | 'isVerified'>) => {
    const newPlaylist: Playlist = {
      ...playlistData,
      id: `pl_${Date.now()}`,
      curatorId: curatorUser.id,
      curatorName: curatorUser.name,
      curatorAvatar: curatorUser.avatarUrl,
      curatorSpotifyId: curatorUser.spotifyId || 'spotify:user:curator',
      approvalRate: 15,
      avgResponseHours: 24,
      isVerified: curatorUser.verifiedStatus,
      recentAddedTracks: []
    };

    setPlaylists(prev => [newPlaylist, ...prev]);
  };

  const togglePlaylistStatus = (id: string) => {
    setPlaylists(prev =>
      prev.map(p => (p.id === id ? { ...p, acceptingSubmissions: !p.acceptingSubmissions } : p))
    );
  };

  // Admin approvals
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

  const addArtistTrack = (trackData: Omit<Track, 'id'>) => {
    const newTrack: Track = {
      ...trackData,
      id: `trk_${Date.now()}`,
      playCount: Math.floor(Math.random() * 8000) + 1200
    };
    setArtistTracks(prev => [newTrack, ...prev]);
  };

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
        recentLivePlacement
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
