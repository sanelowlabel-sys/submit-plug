import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Track } from '../../types';
import { DashboardAnalyticsCharts } from '../common/DashboardAnalyticsCharts';
import {
  Music2,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Coins,
  Play,
  Pause,
  Plus,
  Radio,
  Search,
  Zap,
  Target,
  BarChart3,
  Flame,
  Volume2,
  ArrowUpRight
} from 'lucide-react';

export const ArtistDashboard: React.FC = () => {
  const {
    currentUser,
    artistSubmissions,
    artistTracks,
    addArtistTrack,
    playlists,
    openPitchModal,
    openLoginModal,
    openRegisterModal,
    setBuyCreditsModalOpen,
    audioState,
    playTrack,
    pauseTrack,
    transactions
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'recommendations' | 'catalog' | 'analytics' | 'wallet'>('campaigns');

  // Add Track Form State
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackGenre, setNewTrackGenre] = useState('Deep House');
  const [newTrackBpm, setNewTrackBpm] = useState(124);
  const [newTrackKey, setNewTrackKey] = useState('F Minor');
  const [newTrackSpotifyUrl, setNewTrackSpotifyUrl] = useState('');
  const [newTrackAlbumArt, setNewTrackAlbumArt] = useState('https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop');

  const filteredSubmissions = artistSubmissions.filter(sub => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'placed' && (sub.status === 'added_to_playlist' || sub.status === 'approved')) ||
      (statusFilter === 'pending' && sub.status === 'pending') ||
      (statusFilter === 'declined' && sub.status === 'declined');

    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      !q ||
      (sub.track?.title || '').toLowerCase().includes(q) ||
      (sub.playlistTitle || '').toLowerCase().includes(q) ||
      (sub.curatorName || '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const totalPlaced = artistSubmissions.filter(
    s => s.status === 'added_to_playlist' || s.status === 'approved'
  ).length;
  const totalPending = artistSubmissions.filter(s => s.status === 'pending').length;
  const placementRate =
    artistSubmissions.length > 0
      ? Math.round((totalPlaced / artistSubmissions.length) * 100)
      : 0;

  // Smart matching score algorithm
  const recommendedPlaylists = playlists.map(pl => {
    const artistGenre = (artistTracks[0]?.genre || 'Deep House').toLowerCase();
    const genreMatch = (pl.genres || []).some(g => {
      const gLower = (g || '').toLowerCase();
      return gLower.includes(artistGenre) || artistGenre.includes(gLower);
    });
    const matchScore = genreMatch ? (pl.approvalRate > 15 ? 96 : 89) : 74;
    return { playlist: pl, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;

    addArtistTrack({
      title: newTrackTitle,
      artist: currentUser.name,
      genre: newTrackGenre,
      bpm: Number(newTrackBpm) || 124,
      key: newTrackKey || 'F Minor',
      albumArt: newTrackAlbumArt,
      spotifyUrl: newTrackSpotifyUrl || `https://open.spotify.com/track/${Date.now()}`,
      spotifyUri: `spotify:track:${Date.now()}`,
      previewUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
      durationSec: 184,
      releaseDate: new Date().toISOString().split('T')[0]
    });

    setShowAddTrackModal(false);
    setNewTrackTitle('');
    setNewTrackSpotifyUrl('');
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 text-center space-y-6 bg-surface shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-spotify-green/10 border border-spotify-green/30 flex items-center justify-center mx-auto text-spotify-green">
            <Music2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Artist Hub & Campaigns</h2>
            <p className="text-sm font-sans text-white/60 max-w-md mx-auto">
              Sign in or create an account to manage your release catalog, pitch tracks to verified Spotify curators, and track placement decisions in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openLoginModal()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-spotify-green/20"
            >
              Sign In to Artist Hub
            </button>
            <button
              onClick={() => openRegisterModal()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-hover hover:bg-white/10 border border-white/10 text-white font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Create Free Artist Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Artist Profile Header Bar */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden bg-surface">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-spotify-green shadow-lg"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-spotify-green text-[9px] font-sans text-black rounded-full font-bold uppercase shadow-sm">
              ARTIST
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white">{currentUser.name}</h1>
              {currentUser.verifiedStatus && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-sans font-bold flex items-center gap-1 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> SPOTIFY VERIFIED
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 font-sans mt-0.5 max-w-lg truncate">
              {currentUser.bio}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-white/50 mt-2">
              <span>Spotify: {(currentUser.spotifyFollowers || 45000).toLocaleString()} Monthly Listeners</span>
              <span>•</span>
              <a
                href={currentUser.spotifyUri || 'https://open.spotify.com'}
                target="_blank"
                rel="noreferrer"
                className="text-spotify-green hover:underline flex items-center gap-1 font-bold"
              >
                Artist Profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBuyCreditsModalOpen(true)}
            className="glass-panel px-4 py-2.5 rounded-2xl border border-white/10 hover:border-spotify-green transition-all flex items-center gap-2 cursor-pointer bg-surface"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-[10px] text-white/50 font-sans">WALLET BALANCE</div>
              <div className="text-xs font-bold font-sans text-white">
                {currentUser.creditBalance} Credits <span className="text-spotify-green font-bold">+Top Up</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => openPitchModal()}
            className="h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20 hover:scale-[1.02] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            PITCH TRACK
          </button>
        </div>
      </div>

      {/* Hero Pitch Track Callout Option */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-gradient-to-r from-spotify-green/10 via-surface to-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-sans text-spotify-green font-bold">
            <Zap className="w-4 h-4 fill-current" />
            <span>ARTIST CAMPAIGN HUB</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            PITCH YOUR TRACK TO SPOTIFY PLAYLIST CURATORS
          </h2>
          <p className="text-xs text-white/60 font-sans max-w-2xl leading-relaxed">
            Submit your unreleased cuts or latest releases directly to verified tastemakers. Choose free submissions with completed follower gates or guaranteed 48-hour premium review.
          </p>
        </div>
        <button
          onClick={() => openPitchModal()}
          className="h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-xl shadow-spotify-green/25 whitespace-nowrap transition-colors"
        >
          <Music2 className="w-4 h-4" />
          PITCH TRACK NOW
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>TOTAL CAMPAIGNS</span>
            <Music2 className="w-4 h-4 text-spotify-green" />
          </div>
          <div className="text-2xl font-bold font-display text-white mt-1">
            {artistSubmissions.length}
          </div>
          <div className="text-[10px] text-white/40 font-sans mt-0.5">Track Pitches Sent</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>ACTIVE PLACEMENTS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
            {totalPlaced}
          </div>
          <div className="text-[10px] text-emerald-400/60 font-sans mt-0.5">
            Added to Playlists
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>PENDING REVIEWS</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-display text-amber-300 mt-1">
            {totalPending}
          </div>
          <div className="text-[10px] text-amber-400/60 font-sans mt-0.5">In Curator Inboxes</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>ACCEPTANCE RATE</span>
            <TrendingUp className="w-4 h-4 text-spotify-green" />
          </div>
          <div className="text-2xl font-bold font-display text-white mt-1">
            {placementRate}%
          </div>
          <div className="text-[10px] text-white/40 font-sans mt-0.5">Conversion to Playlist</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-spotify-green text-black font-bold shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white glass-panel'
          }`}
        >
          <Music2 className="w-3.5 h-3.5" />
          CAMPAIGN TRACKER ({artistSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'recommendations'
              ? 'bg-spotify-green text-black font-bold shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white glass-panel'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          SMART PLAYLIST MATCHES
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-spotify-green text-black font-bold shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white glass-panel'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          MY TRACK CATALOG ({artistTracks.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-spotify-green text-black font-bold shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white glass-panel'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          STREAMING IMPACT & STATS
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2.5 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'wallet'
              ? 'bg-spotify-green text-black font-bold shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white glass-panel'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          CREDIT WALLET & RECEIPTS
        </button>
      </div>

      {/* TAB 1: Campaign Tracker */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-surface p-1 rounded-2xl border border-white/10 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === 'all' ? 'bg-spotify-green text-black font-bold shadow-sm' : 'text-white/70 hover:text-white'
                }`}
              >
                All ({artistSubmissions.length})
              </button>
              <button
                onClick={() => setStatusFilter('placed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === 'placed' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
                }`}
              >
                Accepted / Placed ({totalPlaced})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
                }`}
              >
                Pending ({totalPending})
              </button>
              <button
                onClick={() => setStatusFilter('declined')}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === 'declined' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-white/70 hover:text-white'
                }`}
              >
                Feedback Received
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full bg-surface text-white pl-9 pr-3 py-2 rounded-xl border border-white/10 text-xs font-sans placeholder:text-white/40 focus:outline-none focus:border-spotify-green transition-colors"
              />
            </div>
          </div>

          {/* Submissions Table / Cards */}
          {filteredSubmissions.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 bg-surface">
              <Music2 className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <h3 className="text-base font-display text-white">No campaigns found</h3>
              <p className="text-xs text-white/50 font-sans mt-1">
                You haven't pitched any songs matching this status filter.
              </p>
              <button
                onClick={() => openPitchModal()}
                className="h-10 px-5 bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold rounded-xl mt-4 cursor-pointer transition-colors shadow-md shadow-spotify-green/20"
              >
                Pitch Your First Song
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-hover/60 border-b border-white/10 text-[10px] font-sans text-white/50 uppercase tracking-wider">
                      <th className="p-4">Track</th>
                      <th className="p-4">Target Playlist</th>
                      <th className="p-4">Tier</th>
                      <th className="p-4">Submitted</th>
                      <th className="p-4">Status & Feedback</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs font-sans">
                    {filteredSubmissions.map(sub => {
                      const isPlayingThis =
                        audioState.isPlaying && audioState.currentTrack?.id === sub.track.id;

                      return (
                        <tr key={sub.id} className="hover:bg-surface-hover/50 transition-colors">
                          {/* Track Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-sm">
                                <img
                                  src={sub.track.albumArt}
                                  alt={sub.track.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  onClick={() => {
                                    if (isPlayingThis) pauseTrack();
                                    else playTrack(sub.track, sub.playlistTitle);
                                  }}
                                  className="absolute inset-0 bg-black/40 hover:bg-black/70 flex items-center justify-center text-white cursor-pointer transition-colors"
                                >
                                  {isPlayingThis ? (
                                    <Pause className="w-4 h-4 fill-current text-spotify-green" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  )}
                                </button>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white font-display text-xs truncate max-w-[160px]">
                                  {sub.track.title}
                                </div>
                                <div className="text-[10px] text-white/50 truncate">
                                  {sub.track.artist} • {sub.track.genre}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Playlist Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <img
                                src={sub.playlistCover}
                                alt={sub.playlistTitle}
                                className="w-8 h-8 rounded-lg object-cover border border-white/10 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate max-w-[150px]">
                                  {sub.playlistTitle}
                                </div>
                                <div className="text-[10px] text-white/50 truncate">
                                  Curator: {sub.curatorName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tier Column */}
                          <td className="p-4">
                            {sub.pitchType === 'premium' ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-[10px] font-bold border border-spotify-green/30">
                                PREMIUM ⭐
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                FREE
                              </span>
                            )}
                          </td>

                          {/* Submitted Date */}
                          <td className="p-4 text-white/60 text-[11px]">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>

                          {/* Status & Feedback */}
                          <td className="p-4 max-w-xs">
                            {sub.status === 'added_to_playlist' || sub.status === 'approved' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                                  <CheckCircle2 className="w-3 h-3" /> ADDED TO PLAYLIST
                                </span>
                                {sub.feedbackNote && (
                                  <div className="text-[11px] text-white/80 italic mt-0.5 line-clamp-1">
                                    "{sub.feedbackNote}"
                                  </div>
                                )}
                              </div>
                            ) : sub.status === 'declined' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                                  <XCircle className="w-3 h-3" /> FEEDBACK RECEIVED
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sub.feedbackTags.map(tag => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded-md bg-surface-hover text-[9px] text-white/70 border border-white/10"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                {sub.feedbackNote && (
                                  <div className="text-[10px] text-white/60 italic line-clamp-1">
                                    "{sub.feedbackNote}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                  <Clock className="w-3 h-3" /> IN REVIEW QUEUE
                                </span>
                                <div className="text-[10px] text-white/40 mt-0.5">
                                  Curator listening in progress
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Action Link */}
                          <td className="p-4 text-right">
                            {sub.spotifyPlacementUrl ? (
                              <a
                                href={sub.spotifyPlacementUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-8 px-3 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-[10px] inline-flex items-center gap-1 font-bold transition-colors cursor-pointer"
                              >
                                View on Spotify <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                onClick={() => openPitchModal(playlists.find(p => p.id === sub.playlistId))}
                                className="h-8 px-3 rounded-xl bg-surface-hover border border-white/10 text-[10px] text-white/70 hover:text-white hover:border-white/20 transition-colors font-sans cursor-pointer"
                              >
                                Re-Pitch Track
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Smart Playlist Matches */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-sans text-spotify-green font-bold">
                <Sparkles className="w-4 h-4" /> AI SOUND MATCHING ENGINE
              </div>
              <h3 className="text-base font-display font-bold text-white mt-0.5">
                TOP CURATORS COMPATIBLE WITH YOUR SOUND
              </h3>
              <p className="text-xs text-white/60 font-sans mt-1">
                Analyzed based on your BPM ({artistTracks[0]?.bpm || 124}), genre ({artistTracks[0]?.genre || 'Deep House'}), and historical curator approvals.
              </p>
            </div>
            <button
              onClick={() => openPitchModal()}
              className="h-11 px-5 bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold rounded-2xl whitespace-nowrap cursor-pointer transition-colors shadow-md shadow-spotify-green/20"
            >
              Batch Pitch Recommended
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPlaylists.map(({ playlist, matchScore }) => (
              <div
                key={playlist.id}
                className="glass-panel p-5 rounded-3xl border border-white/10 hover:border-spotify-green/50 transition-all space-y-4 shadow-lg bg-surface"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={playlist.coverArt}
                      alt={playlist.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm font-bold font-display text-white truncate max-w-[200px]">
                        {playlist.title}
                      </h4>
                      <div className="text-xs text-white/60 font-sans">
                        Curator: {playlist.curatorName}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-sans font-bold mt-1">
                        ● {playlist.followerCount.toLocaleString()} Active Followers
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-xs font-bold font-sans border border-spotify-green/40">
                      <Flame className="w-3 h-3" /> {matchScore}% MATCH
                    </div>
                  </div>
                </div>

                <div className="bg-surface-hover/70 p-3 rounded-2xl border border-white/10 flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="text-white/40">Approval: </span>
                    <strong className="text-emerald-400">{playlist.approvalRate}%</strong>
                  </div>
                  <div>
                    <span className="text-white/40">Turnaround: </span>
                    <strong className="text-amber-300">~{playlist.avgResponseHours}h</strong>
                  </div>
                  <div>
                    <span className="text-white/40">Cost: </span>
                    <strong className="text-white">{playlist.freePitchEnabled ? 'Free' : `${playlist.pitchCostCredits} Cr`}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {playlist.genres.slice(0, 2).map(g => (
                      <span key={g} className="px-2 py-0.5 rounded-md bg-surface-hover text-[10px] font-sans text-white/70 border border-white/5">
                        {g}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => openPitchModal(playlist)}
                    className="h-9 px-4 bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Pitch Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Artist Track Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-white">RELEASES READY FOR PITCHING</h3>
              <p className="text-xs text-white/60 font-sans">
                Manage your songs, audio previews, BPM metadata, and direct pitch actions.
              </p>
            </div>
            <button
              onClick={() => setShowAddTrackModal(true)}
              className="h-10 px-4 bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Release URL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artistTracks.map(trk => (
              <div
                key={trk.id}
                className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-spotify-green/40 transition-all shadow-md bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-sm">
                    <img
                      src={trk.albumArt}
                      alt={trk.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => playTrack(trk)}
                      className="absolute inset-0 bg-black/40 hover:bg-black/70 flex items-center justify-center text-white cursor-pointer transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white group-hover:text-spotify-green transition-colors">
                      {trk.title}
                    </h4>
                    <div className="text-xs text-white/60 font-sans">
                      {trk.artist} • {trk.genre}
                    </div>
                    <div className="text-[10px] text-white/40 font-sans mt-0.5">
                      BPM: {trk.bpm || 124} | Key: {trk.key || 'D Minor'} | Released: {trk.releaseDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={trk.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-surface-hover border border-white/10 text-white/60 hover:text-white hover:border-spotify-green transition-colors"
                    title="Spotify link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => openPitchModal()}
                    className="h-8 px-3.5 bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    Pitch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Streaming Impact & Stats */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <DashboardAnalyticsCharts role="artist" />
        </div>
      )}

      {/* TAB 5: Wallet & Receipts */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface">
            <div>
              <div className="text-xs font-sans text-spotify-green font-bold">WALLET BALANCE</div>
              <div className="text-3xl font-bold font-display text-white mt-1">
                {currentUser.creditBalance} Credits
              </div>
              <p className="text-xs text-white/60 font-sans mt-1">
                Use credits for 1-click guaranteed curator pitches, feedback tags, and priority delivery.
              </p>
            </div>
            <button
              onClick={() => setBuyCreditsModalOpen(true)}
              className="h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-xs rounded-2xl shadow-lg shadow-spotify-green/20 cursor-pointer transition-colors whitespace-nowrap"
            >
              PURCHASE CREDIT BUNDLE
            </button>
          </div>

          <div>
            <h3 className="text-xs font-display tracking-wider text-white mb-3 font-bold uppercase">
              TRANSACTION HISTORY & PAYPAL RECEIPTS
            </h3>
            <div className="glass-panel rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden bg-surface">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs font-sans text-white/50">
                  No transactions yet.
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tx.amount > 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{tx.description}</div>
                        <div className="text-[10px] text-white/40">
                          {new Date(tx.createdAt).toLocaleString()} • ID: {tx.id}
                          {tx.paypalOrderId && (
                            <span className="text-[#0070BA] ml-2">Order: {tx.paypalOrderId}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                      </div>
                      {tx.paypalAmountUsd && (
                        <div className="text-[10px] text-[#0070BA] font-sans flex items-center justify-end gap-1">
                          <span>${tx.paypalAmountUsd.toFixed(2)} USD via PayPal</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Track Modal Form */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-sm font-display font-bold text-white flex items-center gap-2">
                <Music2 className="w-4 h-4 text-spotify-green" />
                ADD TRACK TO CATALOG
              </div>
              <button
                onClick={() => setShowAddTrackModal(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTrack} className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-white/80 block mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  value={newTrackTitle}
                  onChange={e => setNewTrackTitle(e.target.value)}
                  placeholder="e.g. Midnight Mirage"
                  className="w-full bg-surface-hover text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-spotify-green transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/80 block mb-1">Genre</label>
                  <select
                    value={newTrackGenre}
                    onChange={e => setNewTrackGenre(e.target.value)}
                    className="w-full bg-surface-hover text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-spotify-green transition-colors"
                  >
                    <option value="Deep House">Deep House</option>
                    <option value="Melodic Techno">Melodic Techno</option>
                    <option value="Techno">Techno</option>
                    <option value="Indie Pop">Indie Pop</option>
                    <option value="Synthwave">Synthwave</option>
                    <option value="Afrobeats">Afrobeats</option>
                    <option value="Lo-Fi Chill">Lo-Fi Chill</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/80 block mb-1">BPM</label>
                  <input
                    type="number"
                    value={newTrackBpm}
                    onChange={e => setNewTrackBpm(Number(e.target.value))}
                    className="w-full bg-surface-hover text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-spotify-green transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/80 block mb-1">Spotify Track Link / URI</label>
                <input
                  type="url"
                  value={newTrackSpotifyUrl}
                  onChange={e => setNewTrackSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full bg-surface-hover text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-spotify-green transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTrackModal(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white font-sans text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  Save Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
