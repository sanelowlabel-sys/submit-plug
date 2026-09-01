import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Track } from '../../types';
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

    const matchesSearch =
      sub.track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.playlistTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.curatorName.toLowerCase().includes(searchQuery.toLowerCase());

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
    const artistGenre = artistTracks[0]?.genre || 'Deep House';
    const genreMatch = pl.genres.some(g => g.toLowerCase().includes(artistGenre.toLowerCase()) || artistGenre.toLowerCase().includes(g.toLowerCase()));
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Artist Profile Header Bar */}
      <div className="card-sane p-6 sm:p-7 rounded-2xl border border-[#3a3a3a] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#BE1E2F]"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-[#BE1E2F] text-[9px] font-mono-code text-white rounded font-bold uppercase">
              ARTIST
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-title text-white">{currentUser.name}</h1>
              {currentUser.verifiedStatus && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono-code font-bold flex items-center gap-1 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> SPOTIFY VERIFIED
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 font-mono-code mt-0.5 max-w-lg truncate">
              {currentUser.bio}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code text-white/50 mt-2">
              <span>Spotify: {(currentUser.spotifyFollowers || 45000).toLocaleString()} Monthly Listeners</span>
              <span>•</span>
              <a
                href={currentUser.spotifyUri || 'https://open.spotify.com'}
                target="_blank"
                rel="noreferrer"
                className="text-[#BE1E2F] hover:underline flex items-center gap-1 font-bold"
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
            className="card-panel px-4 py-2.5 rounded-xl border border-[#3a3a3a] hover:border-[#BE1E2F] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-[10px] text-white/50 font-mono-code">WALLET BALANCE</div>
              <div className="text-xs font-bold font-mono-code text-white">
                {currentUser.creditBalance} Credits <span className="text-[#BE1E2F]">+Top Up</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => openPitchModal()}
            className="btn-sane text-xs px-5 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#BE1E2F]/20"
          >
            <Sparkles className="w-4 h-4" />
            PITCH NEW RELEASE
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>TOTAL CAMPAIGNS</span>
            <Music2 className="w-3.5 h-3.5 text-[#BE1E2F]" />
          </div>
          <div className="text-2xl font-bold font-title text-white mt-1">
            {artistSubmissions.length}
          </div>
          <div className="text-[10px] text-white/40 font-mono-code mt-0.5">Track Pitches Sent</div>
        </div>

        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>ACTIVE PLACEMENTS</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-title text-emerald-400 mt-1">
            {totalPlaced}
          </div>
          <div className="text-[10px] text-emerald-400/60 font-mono-code mt-0.5">
            Added to Playlists
          </div>
        </div>

        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>PENDING REVIEWS</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-title text-amber-300 mt-1">
            {totalPending}
          </div>
          <div className="text-[10px] text-amber-400/60 font-mono-code mt-0.5">In Curator Inboxes</div>
        </div>

        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>ACCEPTANCE RATE</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#BE1E2F]" />
          </div>
          <div className="text-2xl font-bold font-title text-white mt-1">
            {placementRate}%
          </div>
          <div className="text-[10px] text-white/40 font-mono-code mt-0.5">Conversion to Playlist</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#3a3a3a] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <Music2 className="w-3.5 h-3.5" />
          CAMPAIGN TRACKER ({artistSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'recommendations'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-[#BE1E2F]" />
          SMART PLAYLIST MATCHES
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          MY TRACK CATALOG ({artistTracks.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          STREAMING IMPACT & STATS
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'wallet'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
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
            <div className="flex items-center gap-1 bg-[#2b2b2b] p-1 rounded-xl border border-[#3a3a3a] overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-[#BE1E2F] text-white font-bold' : 'text-white/70'
                }`}
              >
                All ({artistSubmissions.length})
              </button>
              <button
                onClick={() => setStatusFilter('placed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap ${
                  statusFilter === 'placed' ? 'bg-emerald-600 text-white font-bold' : 'text-white/70'
                }`}
              >
                Accepted / Placed ({totalPlaced})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white font-bold' : 'text-white/70'
                }`}
              >
                Pending ({totalPending})
              </button>
              <button
                onClick={() => setStatusFilter('declined')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap ${
                  statusFilter === 'declined' ? 'bg-rose-700 text-white font-bold' : 'text-white/70'
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
                className="w-full bg-[#2b2b2b] text-white pl-9 pr-3 py-2 rounded-xl border border-[#3a3a3a] text-xs font-mono-code placeholder:text-white/40 focus:outline-none focus:border-[#BE1E2F]"
              />
            </div>
          </div>

          {/* Submissions Table / Cards */}
          {filteredSubmissions.length === 0 ? (
            <div className="card-sane p-12 text-center rounded-xl border border-[#3a3a3a]">
              <Music2 className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <h3 className="text-base font-title text-white">No campaigns found</h3>
              <p className="text-xs text-white/50 font-mono-code mt-1">
                You haven't pitched any songs matching this status filter.
              </p>
              <button
                onClick={() => openPitchModal()}
                className="btn-sane text-xs px-4 py-2 rounded-lg font-bold mt-4 cursor-pointer"
              >
                Pitch Your First Song
              </button>
            </div>
          ) : (
            <div className="card-sane rounded-2xl border border-[#3a3a3a] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a1a1a] border-b border-[#3a3a3a] text-[10px] font-mono-code text-white/50 uppercase">
                      <th className="p-4">Track</th>
                      <th className="p-4">Target Playlist</th>
                      <th className="p-4">Tier</th>
                      <th className="p-4">Submitted</th>
                      <th className="p-4">Status & Feedback</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3a3a3a]/60 text-xs font-mono-code">
                    {filteredSubmissions.map(sub => {
                      const isPlayingThis =
                        audioState.isPlaying && audioState.currentTrack?.id === sub.track.id;

                      return (
                        <tr key={sub.id} className="hover:bg-[#1a1a1a]/70 transition-colors">
                          {/* Track Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#3a3a3a]">
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
                                  className="absolute inset-0 bg-black/40 hover:bg-black/70 flex items-center justify-center text-white cursor-pointer"
                                >
                                  {isPlayingThis ? (
                                    <Pause className="w-4 h-4 fill-current text-[#BE1E2F]" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  )}
                                </button>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white font-title text-xs truncate max-w-[160px]">
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
                                className="w-7 h-7 rounded object-cover border border-[#3a3a3a]"
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
                              <span className="px-2 py-0.5 rounded bg-[#BE1E2F]/20 text-[#BE1E2F] text-[10px] font-bold border border-[#BE1E2F]/30">
                                PREMIUM ⭐
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
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
                                      className="px-1.5 py-0.2 rounded bg-[#1a1a1a] text-[9px] text-white/70 border border-[#3a3a3a]"
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
                                className="btn-sane text-[10px] px-2.5 py-1 rounded-md inline-flex items-center gap-1 font-bold"
                              >
                                View on Spotify <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                onClick={() => openPitchModal(playlists.find(p => p.id === sub.playlistId))}
                                className="card-panel text-[10px] px-2.5 py-1 rounded-md text-white/70 hover:text-white font-mono-code"
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
          <div className="card-panel p-5 rounded-2xl border border-[#3a3a3a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-code text-[#BE1E2F] font-bold">
                <Sparkles className="w-4 h-4" /> AI SOUND MATCHING ENGINE
              </div>
              <h3 className="text-base font-title text-white mt-0.5">
                TOP CURATORS COMPATIBLE WITH YOUR SOUND
              </h3>
              <p className="text-xs text-white/60 font-mono-code mt-1">
                Analyzed based on your BPM ({artistTracks[0]?.bpm || 124}), genre ({artistTracks[0]?.genre || 'Deep House'}), and historical curator approvals.
              </p>
            </div>
            <button
              onClick={() => openPitchModal()}
              className="btn-sane text-xs px-5 py-2.5 rounded-xl font-bold whitespace-nowrap"
            >
              Batch Pitch Recommended
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPlaylists.map(({ playlist, matchScore }) => (
              <div
                key={playlist.id}
                className="card-sane p-5 rounded-2xl border border-[#3a3a3a] hover:border-[#BE1E2F] transition-all space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={playlist.coverArt}
                      alt={playlist.title}
                      className="w-16 h-16 rounded-xl object-cover border border-[#3a3a3a]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm font-bold font-title text-white truncate max-w-[200px]">
                        {playlist.title}
                      </h4>
                      <div className="text-xs text-white/60 font-mono-code">
                        Curator: {playlist.curatorName}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono-code font-bold mt-1">
                        ● {playlist.followerCount.toLocaleString()} Active Followers
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#BE1E2F]/20 text-[#BE1E2F] text-xs font-bold font-mono-code border border-[#BE1E2F]/40">
                      <Flame className="w-3 h-3" /> {matchScore}% MATCH
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#3a3a3a] flex items-center justify-between text-xs font-mono-code">
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
                      <span key={g} className="px-2 py-0.5 rounded bg-[#2b2b2b] text-[10px] font-mono-code text-white/70">
                        {g}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => openPitchModal(playlist)}
                    className="btn-sane text-xs px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
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
              <h3 className="text-sm font-title text-white">RELEASES READY FOR PITCHING</h3>
              <p className="text-xs text-white/60 font-mono-code">
                Manage your songs, audio previews, BPM metadata, and direct pitch actions.
              </p>
            </div>
            <button
              onClick={() => setShowAddTrackModal(true)}
              className="btn-sane text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Release URL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artistTracks.map(trk => (
              <div
                key={trk.id}
                className="card-sane p-4 rounded-xl border border-[#3a3a3a] flex items-center justify-between group hover:border-[#BE1E2F] transition-all shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[#3a3a3a]">
                    <img
                      src={trk.albumArt}
                      alt={trk.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => playTrack(trk)}
                      className="absolute inset-0 bg-black/40 hover:bg-black/70 flex items-center justify-center text-white cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-title text-white group-hover:text-[#BE1E2F] transition-colors">
                      {trk.title}
                    </h4>
                    <div className="text-xs text-white/60 font-mono-code">
                      {trk.artist} • {trk.genre}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono-code mt-0.5">
                      BPM: {trk.bpm || 124} | Key: {trk.key || 'D Minor'} | Released: {trk.releaseDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={trk.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] text-white/60 hover:text-white hover:border-[#BE1E2F]"
                    title="Spotify link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => openPitchModal()}
                    className="btn-sane text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
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
          <div className="card-panel p-6 rounded-2xl border border-[#3a3a3a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono-code text-[#BE1E2F] font-bold">ORGANIC DISCOVERY ESTIMATOR</span>
                <h3 className="text-xl font-title text-white mt-1">
                  ESTIMATED STREAMING BOOST FROM SUBMIT PLUG
                </h3>
                <p className="text-xs text-white/60 font-mono-code mt-0.5">
                  Tracked over active placements on verified Spotify playlists.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-3xl font-bold font-title text-emerald-400">
                  +{(totalPlaced * 14500 + 3200).toLocaleString()} Streams
                </div>
                <div className="text-[10px] text-white/50 font-mono-code">
                  Generated this month across all playlists
                </div>
              </div>
            </div>

            {/* Visual Stream Graph Simulator */}
            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#3a3a3a] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-code text-white/60">
                <span>30-Day Stream Growth Trajectory</span>
                <span className="text-emerald-400 font-bold">▲ +48.2% vs Previous Period</span>
              </div>

              <div className="flex items-end gap-2 h-28 pt-4">
                {[35, 42, 38, 55, 60, 52, 68, 75, 70, 84, 92, 100].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      className="w-full bg-[#BE1E2F]/80 group-hover:bg-[#BE1E2F] rounded-t transition-all duration-300 relative"
                      style={{ height: `${val}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#2b2b2b] text-[10px] font-mono-code text-white px-1.5 py-0.5 rounded border border-[#3a3a3a] pointer-events-none whitespace-nowrap">
                        +{val * 120}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono-code text-white/40">W{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Wallet & Receipts */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="card-panel p-6 rounded-2xl border border-[#3a3a3a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-code text-[#BE1E2F] font-bold">WALLET BALANCE</div>
              <div className="text-3xl font-bold font-title text-white mt-1">
                {currentUser.creditBalance} Credits
              </div>
              <p className="text-xs text-white/60 font-mono-code mt-1">
                Use credits for 1-click guaranteed curator pitches, feedback tags, and priority delivery.
              </p>
            </div>
            <button
              onClick={() => setBuyCreditsModalOpen(true)}
              className="btn-sane text-xs px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#BE1E2F]/20 cursor-pointer"
            >
              PURCHASE CREDIT BUNDLE
            </button>
          </div>

          <div>
            <h3 className="text-xs font-title tracking-wider text-white mb-3">
              TRANSACTION HISTORY & STRIPE RECEIPTS
            </h3>
            <div className="card-sane rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]/60">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono-code text-white/50">
                  No transactions yet.
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between text-xs font-mono-code">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
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
                      {tx.stripeAmountUsd && (
                        <div className="text-[10px] text-white/50 font-mono-code">
                          ${tx.stripeAmountUsd.toFixed(2)} USD via Stripe
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card-sane w-full max-w-md rounded-2xl border border-[#3a3a3a] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3a3a3a]">
              <div className="text-sm font-title text-white flex items-center gap-2">
                <Music2 className="w-4 h-4 text-[#BE1E2F]" />
                ADD TRACK TO CATALOG
              </div>
              <button
                onClick={() => setShowAddTrackModal(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTrack} className="space-y-4 text-xs font-mono-code">
              <div>
                <label className="text-white/80 block mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  value={newTrackTitle}
                  onChange={e => setNewTrackTitle(e.target.value)}
                  placeholder="e.g. Midnight Mirage"
                  className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] focus:outline-none focus:border-[#BE1E2F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/80 block mb-1">Genre</label>
                  <select
                    value={newTrackGenre}
                    onChange={e => setNewTrackGenre(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] focus:outline-none focus:border-[#BE1E2F]"
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
                    className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] focus:outline-none focus:border-[#BE1E2F]"
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
                  className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] focus:outline-none focus:border-[#BE1E2F]"
                />
              </div>

              <div className="pt-3 border-t border-[#3a3a3a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTrackModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-sane text-xs px-5 py-2.5 rounded-xl font-bold cursor-pointer"
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
