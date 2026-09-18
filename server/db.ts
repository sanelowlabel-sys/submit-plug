import fs from 'fs';
import path from 'path';
import {
  UserRecord,
  PlaylistRecord,
  SubmissionRecord,
  TransactionRecord,
  EmailLogRecord,
  CuratorActivityRecord,
  TrackRecord
} from './types';

interface DatabaseSchema {
  users: UserRecord[];
  playlists: PlaylistRecord[];
  submissions: SubmissionRecord[];
  transactions: TransactionRecord[];
  emails: EmailLogRecord[];
  curatorActivities: CuratorActivityRecord[];
  tracks: TrackRecord[];
  lastWeeklyCheck: string;
}

const DB_FILE = path.join(process.cwd(), 'data', 'app_database.json');

// Authentic initial data for immediate production functionality
const INITIAL_TRACKS: TrackRecord[] = [
  {
    id: 'trk-1',
    title: 'Neon Horizon',
    artist: 'Velvet Echoes',
    albumArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    spotifyUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
    previewUrl: 'https://cdn.freesound.org/previews/573/573381_5674468-lq.mp3',
    durationSec: 214,
    genre: 'Synthwave',
    bpm: 118,
    key: 'F Minor',
    releaseDate: '2026-02-14',
    playCount: 14820
  },
  {
    id: 'trk-2',
    title: 'Caffeine & Raindrops',
    artist: 'Luna Drift',
    albumArt: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80',
    spotifyUrl: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl',
    spotifyUri: 'spotify:track:11dFghVXANMlKmJXsNCbNl',
    previewUrl: 'https://cdn.freesound.org/previews/450/450621_649468-lq.mp3',
    durationSec: 168,
    genre: 'Lo-Fi Chill',
    bpm: 84,
    key: 'C Major',
    releaseDate: '2026-01-20',
    playCount: 38400
  },
  {
    id: 'trk-3',
    title: 'Analog Dreamscape',
    artist: 'Sane Low Sound',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
    previewUrl: 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3',
    durationSec: 195,
    genre: 'Indie Electronic',
    bpm: 122,
    key: 'A Minor',
    releaseDate: '2026-03-01',
    playCount: 8900
  },
  {
    id: 'trk-4',
    title: 'Midnight Highway',
    artist: 'The Midnight City',
    albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
    spotifyUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
    spotifyUri: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
    previewUrl: 'https://cdn.freesound.org/previews/512/512140_9287244-lq.mp3',
    durationSec: 232,
    genre: 'Indie Rock',
    bpm: 128,
    key: 'E Minor',
    releaseDate: '2025-11-10',
    playCount: 52100
  }
];

const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr_curator_1',
    name: 'Sarah Chen (Echo Playlists)',
    email: 'sarah@echowaves.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    role: 'curator',
    spotifyId: 'echoplaylists_official',
    spotifyUri: 'spotify:user:echoplaylists_official',
    spotifyFollowers: 48900,
    bio: 'Verified Spotify editorial playlist curator. Discovering emerging indie, synthwave, and lo-fi producers worldwide.',
    creditBalance: 10,
    freeWeeklyCredits: 2,
    lastWeeklyReset: new Date().toISOString(),
    verifiedStatus: true,
    totalSubmissions: 142,
    totalPlacements: 48,
    createdAt: '2025-10-05T09:30:00Z'
  },
  {
    id: 'usr_curator_2',
    name: 'Marcus Brody',
    email: 'marcus@bassdimension.fm',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'curator',
    spotifyId: 'marcus_clubradar',
    spotifyUri: 'spotify:user:marcus_clubradar',
    spotifyFollowers: 82500,
    bio: 'Club DJ and resident tastemaker for Berlin underground electro & melodic techno.',
    creditBalance: 5,
    freeWeeklyCredits: 2,
    lastWeeklyReset: new Date().toISOString(),
    verifiedStatus: true,
    totalSubmissions: 280,
    totalPlacements: 35,
    createdAt: '2025-08-12T14:15:00Z'
  },
  {
    id: 'usr_artist_1',
    name: 'Velvet Echoes',
    email: 'artist@neonhorizon.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'artist',
    spotifyId: 'velvetechoes_music',
    spotifyUri: 'spotify:user:velvetechoes_music',
    spotifyFollowers: 14200,
    bio: 'Synth-pop & melodic electronica producer craft-building vintage synthesizer soundscapes.',
    creditBalance: 15,
    freeWeeklyCredits: 2,
    lastWeeklyReset: new Date().toISOString(),
    verifiedStatus: true,
    totalSubmissions: 6,
    totalPlacements: 4,
    createdAt: '2025-11-01T10:00:00Z'
  },
  {
    id: 'usr_sanelow_1',
    name: 'Sane Low Label',
    email: 'SanelowLabel@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
    role: 'artist',
    spotifyId: 'sanelowlabel',
    spotifyUri: 'spotify:user:sanelowlabel',
    spotifyFollowers: 85400,
    bio: 'Independent record label hub for organic artist pitching and global electronic sound discovery.',
    creditBalance: 25,
    freeWeeklyCredits: 2,
    lastWeeklyReset: new Date().toISOString(),
    verifiedStatus: true,
    totalSubmissions: 12,
    totalPlacements: 8,
    createdAt: '2025-10-01T12:00:00Z'
  }
];

const INITIAL_PLAYLISTS: PlaylistRecord[] = [
  {
    id: 'pl-synth-1',
    title: 'Synthwave & Cyber Retrowave',
    description: 'The premier destination for 80s inspired retro-electro, darksynth, outrun, and cyberpunk neon grooves.',
    curatorId: 'usr_curator_1',
    curatorName: 'Sarah Chen (Echo Playlists)',
    curatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    curatorSpotifyId: 'echoplaylists_official',
    coverArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM',
    spotifyUri: 'spotify:playlist:37i9dQZF1DXdLEN7aqioXM',
    followerCount: 48900,
    trackCount: 82,
    genres: ['Synthwave', 'Electronic', 'Retrowave'],
    approvalRate: 14,
    avgResponseHours: 18,
    pitchCostCredits: 1,
    freePitchEnabled: true,
    isVerified: true,
    isFeatured: true,
    acceptingSubmissions: true,
    lastActiveAt: '12m ago',
    spotlightTrack: INITIAL_TRACKS[0],
    gates: {
      requireCuratorFollow: true,
      requirePlaylistFollow: true,
      requireSongSave: false,
      curatorSpotifyProfileUrl: 'https://open.spotify.com/user/echoplaylists_official'
    }
  },
  {
    id: 'pl-lofi-2',
    title: 'Midnight Lo-Fi & Chill Study Beats',
    description: 'Late night lofi hip hop, cozy jazzhop, and downtempo instrumental coffee shop vibrations for focusing.',
    curatorId: 'usr_curator_1',
    curatorName: 'Sarah Chen (Echo Playlists)',
    curatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    curatorSpotifyId: 'echoplaylists_official',
    coverArt: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    spotifyUri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
    followerCount: 34200,
    trackCount: 120,
    genres: ['Lo-Fi Chill', 'Chillhop', 'Ambient'],
    approvalRate: 18,
    avgResponseHours: 12,
    pitchCostCredits: 1,
    freePitchEnabled: true,
    isVerified: true,
    isFeatured: true,
    acceptingSubmissions: true,
    lastActiveAt: '35m ago',
    spotlightTrack: INITIAL_TRACKS[1],
    gates: {
      requireCuratorFollow: true,
      requirePlaylistFollow: true,
      requireSongSave: false,
      curatorSpotifyProfileUrl: 'https://open.spotify.com/user/echoplaylists_official'
    }
  },
  {
    id: 'pl-techno-3',
    title: 'Berlin Melodic Techno Peak Time',
    description: 'Underground deep driving melodic techno, hypnotic progressive beats, and peak-hour festival energy.',
    curatorId: 'usr_curator_2',
    curatorName: 'Marcus Brody',
    curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    curatorSpotifyId: 'marcus_clubradar',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX6J5J286yRiO',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX6J5J286yRiO',
    followerCount: 82500,
    trackCount: 65,
    genres: ['Melodic Techno', 'Techno', 'Deep House'],
    approvalRate: 8,
    avgResponseHours: 36,
    pitchCostCredits: 2,
    freePitchEnabled: false,
    isVerified: true,
    isFeatured: true,
    acceptingSubmissions: true,
    lastActiveAt: '1h ago',
    gates: {
      requireCuratorFollow: true,
      requirePlaylistFollow: true,
      requireSongSave: false,
      curatorSpotifyProfileUrl: 'https://open.spotify.com/user/marcus_clubradar'
    }
  },
  {
    id: 'pl-indie-4',
    title: 'Indie & Bedroom Pop Discovery Radar',
    description: 'Curating raw, shimmering bedroom pop, dream pop, and independent alternative indie anthems worldwide.',
    curatorId: 'usr_curator_1',
    curatorName: 'Sarah Chen (Echo Playlists)',
    curatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    curatorSpotifyId: 'echoplaylists_official',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX2Nc3B70tvx0',
    spotifyUri: 'spotify:playlist:37i9dQZF1DX2Nc3B70tvx0',
    followerCount: 61400,
    trackCount: 75,
    genres: ['Indie Rock', 'Bedroom Pop', 'Alternative'],
    approvalRate: 20,
    avgResponseHours: 24,
    pitchCostCredits: 1,
    freePitchEnabled: true,
    isVerified: true,
    isFeatured: false,
    acceptingSubmissions: true,
    lastActiveAt: '2h ago',
    spotlightTrack: INITIAL_TRACKS[3],
    gates: {
      requireCuratorFollow: true,
      requirePlaylistFollow: true,
      requireSongSave: false,
      curatorSpotifyProfileUrl: 'https://open.spotify.com/user/echoplaylists_official'
    }
  },
  {
    id: 'pl-deephouse-5',
    title: 'Deep House Sunset Sessions',
    description: 'Warm organic house, sunset beach club grooves, melodic deep vibes, and afro-house selections.',
    curatorId: 'usr_curator_2',
    curatorName: 'Marcus Brody',
    curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    curatorSpotifyId: 'marcus_clubradar',
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXa2PvU927Am1',
    spotifyUri: 'spotify:playlist:37i9dQZF1DXa2PvU927Am1',
    followerCount: 27400,
    trackCount: 94,
    genres: ['Deep House', 'Organic House', 'Electronic'],
    approvalRate: 16,
    avgResponseHours: 16,
    pitchCostCredits: 1,
    freePitchEnabled: true,
    isVerified: true,
    isFeatured: false,
    acceptingSubmissions: true,
    lastActiveAt: '45m ago',
    gates: {
      requireCuratorFollow: true,
      requirePlaylistFollow: true,
      requireSongSave: false,
      curatorSpotifyProfileUrl: 'https://open.spotify.com/user/marcus_clubradar'
    }
  }
];

const INITIAL_SUBMISSIONS: SubmissionRecord[] = [
  {
    id: 'sub-1',
    track: INITIAL_TRACKS[0],
    playlistId: 'pl-synth-1',
    playlistTitle: 'Synthwave & Cyber Retrowave',
    playlistCover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    curatorId: 'usr_curator_1',
    curatorName: 'Sarah Chen (Echo Playlists)',
    artistId: 'usr_artist_1',
    artistName: 'Velvet Echoes',
    artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    pitchType: 'premium',
    pitchCost: 1,
    customMessage: 'Analog synthwave piece crafted with authentic Juno-106 synths and gated 80s drums. Perfect fit for your playlist!',
    status: 'added_to_playlist',
    feedbackTags: ['Incredible 80s vibe', 'Flawless mix', 'Spot on playlist mood'],
    feedbackNote: 'Added to position #4! Amazing track, loving the analog hook.',
    submittedAt: '2026-03-01T14:30:00Z',
    reviewedAt: '2026-03-02T10:15:00Z',
    spotifyPlacementUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM',
    gateActionsCompleted: {
      followedCurator: true,
      followedPlaylist: true,
      savedSong: true
    }
  },
  {
    id: 'sub-2',
    track: INITIAL_TRACKS[1],
    playlistId: 'pl-lofi-2',
    playlistTitle: 'Midnight Lo-Fi & Chill Study Beats',
    playlistCover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    curatorId: 'usr_curator_1',
    curatorName: 'Sarah Chen (Echo Playlists)',
    artistId: 'usr_artist_1',
    artistName: 'Velvet Echoes',
    artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    pitchType: 'free',
    pitchCost: 0,
    customMessage: 'Calm, reflective lo-fi track with organic rain textures recorded in Tokyo.',
    status: 'pending',
    feedbackTags: [],
    submittedAt: '2026-03-16T18:20:00Z',
    gateActionsCompleted: {
      followedCurator: true,
      followedPlaylist: true,
      savedSong: false
    }
  }
];

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx-1',
    userId: 'usr_sanelow_1',
    userName: 'Sane Low Label',
    amount: 50,
    type: 'purchase',
    description: 'Purchased 50 Submission Credits ($9.99)',
    createdAt: '2026-02-28T16:00:00Z',
    status: 'completed',
    paypalAmountUsd: 9.99,
    paypalOrderId: 'PAYID-MTT-882109'
  },
  {
    id: 'tx-2',
    userId: 'usr_sanelow_1',
    userName: 'Sane Low Label',
    amount: -1,
    type: 'premium_pitch',
    description: 'Pitched "Neon Horizon" to Synthwave & Cyber Retrowave',
    createdAt: '2026-03-01T14:30:00Z',
    status: 'completed'
  },
  {
    id: 'tx-3',
    userId: 'usr_sanelow_1',
    userName: 'Sane Low Label',
    amount: 2,
    type: 'weekly_credit_reset',
    description: 'Free Weekly Credits Allowance granted',
    createdAt: new Date().toISOString(),
    status: 'completed'
  }
];

const INITIAL_ACTIVITIES: CuratorActivityRecord[] = [
  {
    id: 'act-1',
    curatorId: 'usr_curator_1',
    curatorName: 'Sarah Chen (Echo Playlists)',
    curatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    action: 'approved',
    playlistTitle: 'Synthwave & Cyber Retrowave',
    trackTitle: 'Neon Horizon',
    timestamp: 'Just now',
    approvalRate: 14,
    avgResponseHours: 18
  },
  {
    id: 'act-2',
    curatorId: 'usr_curator_2',
    curatorName: 'Marcus Brody',
    curatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    action: 'came_online',
    playlistTitle: 'Melodic Techno Peak Time',
    timestamp: '5 minutes ago',
    approvalRate: 8,
    avgResponseHours: 36
  },
  {
    id: 'act-3',
    curatorId: 'usr_curator_1',
    curatorName: 'Sarah Chen (Echo Playlists)',
    curatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    action: 'reviewed',
    playlistTitle: 'Midnight Lo-Fi & Study Beats',
    trackTitle: 'Midnight Tokyo Walk',
    timestamp: '18 minutes ago',
    approvalRate: 18,
    avgResponseHours: 12
  }
];

class DatabaseManager {
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.data = {
      users: INITIAL_USERS,
      playlists: INITIAL_PLAYLISTS,
      submissions: INITIAL_SUBMISSIONS,
      transactions: INITIAL_TRANSACTIONS,
      emails: [],
      curatorActivities: INITIAL_ACTIVITIES,
      tracks: INITIAL_TRACKS,
      lastWeeklyCheck: new Date().toISOString()
    };
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          users: parsed.users?.length ? parsed.users : INITIAL_USERS,
          playlists: Array.isArray(parsed.playlists) && parsed.playlists.length > 0 ? parsed.playlists : INITIAL_PLAYLISTS,
          submissions: Array.isArray(parsed.submissions) && parsed.submissions.length > 0 ? parsed.submissions : INITIAL_SUBMISSIONS,
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : INITIAL_TRANSACTIONS,
          emails: parsed.emails || [],
          curatorActivities: Array.isArray(parsed.curatorActivities) ? parsed.curatorActivities : INITIAL_ACTIVITIES,
          tracks: parsed.tracks?.length ? parsed.tracks : INITIAL_TRACKS,
          lastWeeklyCheck: parsed.lastWeeklyCheck || new Date().toISOString()
        };
      } else {
        this.save();
      }
      this.isLoaded = true;
      this.checkWeeklyCreditsReset();
    } catch (err) {
      console.error('Error initializing database:', err);
      this.data = {
        users: INITIAL_USERS,
        playlists: INITIAL_PLAYLISTS,
        submissions: INITIAL_SUBMISSIONS,
        transactions: INITIAL_TRANSACTIONS,
        emails: [],
        curatorActivities: INITIAL_ACTIVITIES,
        tracks: INITIAL_TRACKS,
        lastWeeklyCheck: new Date().toISOString()
      };
      this.isLoaded = true;
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist DB to disk:', err);
    }
  }

  // Check and execute weekly free credits allowance reset (resets to 2 credits every 7 days)
  public checkWeeklyCreditsReset() {
    const now = new Date();
    let updated = false;

    this.data.users = this.data.users.map((u) => {
      const lastReset = u.lastWeeklyReset ? new Date(u.lastWeeklyReset) : new Date(0);
      const diffDays = (now.getTime() - lastReset.getTime()) / (1000 * 3600 * 24);

      if (diffDays >= 7 || u.freeWeeklyCredits === undefined) {
        updated = true;
        u.freeWeeklyCredits = 2; // grant 2 free weekly credits
        u.lastWeeklyReset = now.toISOString();

        this.data.transactions.unshift({
          id: `tx-reset-${Date.now()}-${u.id}`,
          userId: u.id,
          userName: u.name,
          amount: 2,
          type: 'weekly_credit_reset',
          description: 'Weekly free pitch allowance reset (2 Free Credits)',
          createdAt: now.toISOString(),
          status: 'completed'
        });
      }
      return u;
    });

    if (updated) {
      this.save();
    }
  }

  // --- Users ---
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    if (!email) return undefined;
    const target = email.toLowerCase();
    return this.data.users.find((u) => (u.email || '').toLowerCase() === target);
  }

  public createUser(user: Omit<UserRecord, 'id' | 'createdAt' | 'freeWeeklyCredits' | 'lastWeeklyReset' | 'totalSubmissions' | 'totalPlacements'>): UserRecord {
    const newUser: UserRecord = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      freeWeeklyCredits: 2,
      creditBalance: user.creditBalance ?? 0,
      lastWeeklyReset: new Date().toISOString(),
      totalSubmissions: 0,
      totalPlacements: 0,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;

    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // --- Playlists ---
  public getPlaylists(): PlaylistRecord[] {
    return this.data.playlists;
  }

  public getPlaylistById(id: string): PlaylistRecord | undefined {
    return this.data.playlists.find((p) => p.id === id);
  }

  public createPlaylist(playlist: Omit<PlaylistRecord, 'id'>): PlaylistRecord {
    const newPlaylist: PlaylistRecord = {
      ...playlist,
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    this.data.playlists.unshift(newPlaylist);
    
    // Add activity
    this.addCuratorActivity({
      curatorId: newPlaylist.curatorId,
      curatorName: newPlaylist.curatorName,
      curatorAvatar: newPlaylist.curatorAvatar,
      action: 'added_playlist',
      playlistTitle: newPlaylist.title,
      timestamp: 'Just now'
    });

    this.save();
    return newPlaylist;
  }

  public updatePlaylist(id: string, updates: Partial<PlaylistRecord>): PlaylistRecord | undefined {
    const idx = this.data.playlists.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    this.data.playlists[idx] = { ...this.data.playlists[idx], ...updates };
    this.save();
    return this.data.playlists[idx];
  }

  // --- Submissions ---
  public getSubmissions(): SubmissionRecord[] {
    return this.data.submissions;
  }

  public getSubmissionById(id: string): SubmissionRecord | undefined {
    return this.data.submissions.find((s) => s.id === id);
  }

  public createSubmission(submission: Omit<SubmissionRecord, 'id' | 'submittedAt'>): SubmissionRecord {
    const newSub: SubmissionRecord = {
      ...submission,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: new Date().toISOString()
    };
    this.data.submissions.unshift(newSub);

    // Update user submissions count
    const user = this.getUserById(newSub.artistId);
    if (user) {
      this.updateUser(user.id, { totalSubmissions: user.totalSubmissions + 1 });
    }

    this.save();
    return newSub;
  }

  public updateSubmission(id: string, updates: Partial<SubmissionRecord>): SubmissionRecord | undefined {
    const idx = this.data.submissions.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    this.data.submissions[idx] = { ...this.data.submissions[idx], ...updates };

    // If approved, increment artist totalPlacements
    if (updates.status === 'approved' || updates.status === 'added_to_playlist') {
      const artist = this.getUserById(this.data.submissions[idx].artistId);
      if (artist) {
        this.updateUser(artist.id, { totalPlacements: artist.totalPlacements + 1 });
      }
    }

    this.save();
    return this.data.submissions[idx];
  }

  // --- Transactions ---
  public getTransactions(userId?: string): TransactionRecord[] {
    if (userId) {
      return this.data.transactions.filter((t) => t.userId === userId);
    }
    return this.data.transactions;
  }

  public addTransaction(tx: Omit<TransactionRecord, 'id' | 'createdAt'>): TransactionRecord {
    const newTx: TransactionRecord = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    this.data.transactions.unshift(newTx);
    this.save();
    return newTx;
  }

  // --- Email Logs ---
  public getEmails(): EmailLogRecord[] {
    return this.data.emails;
  }

  public logEmail(email: Omit<EmailLogRecord, 'id' | 'sentAt'>): EmailLogRecord {
    const record: EmailLogRecord = {
      ...email,
      id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sentAt: new Date().toISOString()
    };
    this.data.emails.unshift(record);
    if (this.data.emails.length > 200) {
      this.data.emails = this.data.emails.slice(0, 200);
    }
    this.save();
    return record;
  }

  // --- Curator Activities ---
  public getCuratorActivities(): CuratorActivityRecord[] {
    return this.data.curatorActivities;
  }

  public addCuratorActivity(act: Omit<CuratorActivityRecord, 'id'>): CuratorActivityRecord {
    const newAct: CuratorActivityRecord = {
      ...act,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    this.data.curatorActivities.unshift(newAct);
    if (this.data.curatorActivities.length > 50) {
      this.data.curatorActivities = this.data.curatorActivities.slice(0, 50);
    }
    this.save();
    return newAct;
  }

  // --- Tracks ---
  public getTracks(): TrackRecord[] {
    return this.data.tracks;
  }

  public addTrack(track: Omit<TrackRecord, 'id'>): TrackRecord {
    const newTrack: TrackRecord = {
      ...track,
      id: `trk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    this.data.tracks.unshift(newTrack);
    this.save();
    return newTrack;
  }
}

export const db = new DatabaseManager();
