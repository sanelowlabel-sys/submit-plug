import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Submission, SubmissionStatus, Playlist } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import {
  Music2,
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
  BarChart3,
  Filter,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Check,
  Headphones,
  ArrowUpRight,
  ShieldCheck,
  Disc3,
  Calendar,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SUPABASE_PROJECT_URL, isSupabaseConfigured } from '../../lib/supabase';

export const UserDashboard: React.FC = () => {
  const {
    currentUser,
    submissions,
    playlists,
    openPitchModal,
    openSpotifyWizard,
    setBuyCreditsModalOpen,
    audioState,
    playTrack,
    pauseTrack,
    reviewSubmission,
    showToast,
    isWsConnected,
    setActiveTab
  } = useApp();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState<Submission | null>(null);

  // Filter submissions for logged-in user
  const userSubmissions = useMemo(() => {
    if (!currentUser) return [];
    const currentName = (currentUser.name || '').toLowerCase();
    return submissions.filter((s) => {
      if (!s) return false;
      const matchesId = Boolean(currentUser.id && s.artistId === currentUser.id);
      const sArtist = (s.artistName || '').toLowerCase();
      const matchesName = Boolean(currentName && sArtist && sArtist.includes(currentName));
      const isAdmin = currentUser.role === 'admin';
      return matchesId || matchesName || isAdmin;
    });
  }, [submissions, currentUser]);

  // Derived Analytics Metrics
  const metrics = useMemo(() => {
    const total = userSubmissions.length;
    const pending = userSubmissions.filter((s) => s.status === 'pending').length;
    const approved = userSubmissions.filter(
      (s) => s.status === 'approved' || s.status === 'added_to_playlist'
    ).length;
    const declined = userSubmissions.filter((s) => s.status === 'declined').length;

    const resolved = approved + declined;
    const approvalRate = resolved > 0 ? Math.round((approved / resolved) * 100) : 75;

    // Calculate reach: Sum follower count of approved playlists
    const reachedFollowers = userSubmissions
      .filter((s) => s.status === 'approved' || s.status === 'added_to_playlist')
      .reduce((acc, sub) => {
        const pl = playlists.find((p) => p.id === sub.playlistId);
        return acc + (pl ? pl.followerCount : 15000);
      }, 0);

    return {
      total,
      pending,
      approved,
      declined,
      approvalRate,
      reachCount: reachedFollowers || 84500
    };
  }, [userSubmissions, playlists]);

  // Filtered list
  const filteredSubmissions = useMemo(() => {
    return userSubmissions.filter((s) => {
      // Status match
      if (statusFilter === 'pending' && s.status !== 'pending') return false;
      if (
        statusFilter === 'approved' &&
        s.status !== 'approved' &&
        s.status !== 'added_to_playlist'
      )
        return false;
      if (statusFilter === 'declined' && s.status !== 'declined') return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTrack = (s.track?.title || '').toLowerCase().includes(q);
        const matchesArtist = (s.artistName || '').toLowerCase().includes(q);
        const matchesPlaylist = (s.playlistTitle || '').toLowerCase().includes(q);
        const matchesCurator = (s.curatorName || '').toLowerCase().includes(q);
        return matchesTrack || matchesArtist || matchesPlaylist || matchesCurator;
      }

      return true;
    });
  }, [userSubmissions, statusFilter, searchQuery]);

  // Handle Quick Audio Play
  const handleToggleAudio = (sub: Submission) => {
    if (audioState.isPlaying && audioState.currentTrack?.id === sub.track.id) {
      pauseTrack();
    } else {
      playTrack(sub.track, sub.playlistTitle);
    }
  };

  // Simulate Real-time Status Change (Demonstrates Supabase Realtime live sync)
  const handleSimulateRealtimeDecision = async (sub: Submission, decision: 'approve' | 'decline') => {
    const feedbackTags =
      decision === 'approve'
        ? ['In Rotation', 'Top 10 Position', 'Peak Time Energy']
        : ['Needs Brighter Mix', 'BPM High for Mood'];
    const feedbackNote =
      decision === 'approve'
        ? `Added to slot #3 on ${sub.playlistTitle}! Great melodic progression.`
        : 'Solid arrangement, but looking for more vocal hooks for this edition.';

    await reviewSubmission(sub.id, decision, feedbackTags, feedbackNote);

    if (decision === 'approve') {
      try {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}
      showToast(
        'Real-time Event Dispatched',
        `"${sub.track.title}" marked as Approved via Supabase Realtime channel.`,
        'success'
      );
    } else {
      showToast(
        'Real-time Event Dispatched',
        `"${sub.track.title}" review feedback dispatched.`,
        'info'
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <BrandLogo size={50} />
        <h3 className="text-xl font-bold font-display text-white">AUTHENTICATION REQUIRED</h3>
        <p className="text-xs text-white/60 font-sans max-w-md mx-auto">
          Please sign in with your Supabase credentials to access your personal submission hub, real-time tracking, and campaign analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. Header Profile & Realtime Status Bar */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-surface/90">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-spotify-green/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-spotify-green shadow-xl"
              />
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-spotify-green border-2 border-surface flex items-center justify-center text-black"
                title="Active Realtime Session"
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
                  {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-xs font-mono font-bold uppercase border border-spotify-green/30">
                  {currentUser.role.toUpperCase()}
                </span>
                {currentUser.verifiedStatus && (
                  <span className="flex items-center gap-1 text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    <ShieldCheck className="w-3 h-3 text-spotify-green" />
                    Verified
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-white/60 font-sans max-w-md line-clamp-1">
                {currentUser.bio || 'Independent music creator broadcasting on Playlist Plug.'}
              </p>

              {/* Supabase Realtime Pipeline Pill */}
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1.5 text-spotify-green">
                  <span className="w-2 h-2 rounded-full bg-spotify-green animate-ping" />
                  Supabase Realtime Live
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/50 truncate max-w-[200px]" title={SUPABASE_PROJECT_URL}>
                  Project: nnrcrrgtndknswjwrlzp
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            <button
              onClick={() => openSpotifyWizard()}
              id="dashboard-submit-spotify-btn"
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-spotify-green/20 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Spotify Link</span>
            </button>

            <button
              onClick={() => setBuyCreditsModalOpen(true)}
              className="px-4 py-3 rounded-xl bg-surface-hover hover:bg-white/10 border border-white/10 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{currentUser.creditBalance} Credits</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Submission Analytics (4 KPI Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Submissions */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden bg-surface/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
              Total Submissions
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-spotify-green">
              <Music2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-display text-white mb-1">
            {metrics.total}
          </div>
          <div className="text-[11px] text-white/50 font-sans flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">{metrics.pending} pending review</span>
            <span>across curator queues</span>
          </div>
        </div>

        {/* Metric 2: Approval Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden bg-surface/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
              Approval Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-display text-white mb-1">
            {metrics.approvalRate}%
          </div>
          {/* Progress bar */}
          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-1">
            <div
              className="bg-spotify-green h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.approvalRate}%` }}
            />
          </div>
          <div className="text-[11px] text-spotify-green font-sans">
            {metrics.approved} approved placements
          </div>
        </div>

        {/* Metric 3: Active Campaigns */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden bg-surface/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
              Active Campaigns
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-display text-white mb-1">
            {metrics.pending}
          </div>
          <div className="text-[11px] text-white/50 font-sans flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Avg curator turnaround: ~24 hours</span>
          </div>
        </div>

        {/* Metric 4: Potential Reach / Streams */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden bg-surface/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
              Estimated Reach
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-display text-white mb-1">
            {metrics.reachCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-400 font-sans">
            Aggregate playlist audience reached
          </div>
        </div>
      </div>

      {/* 3. Submission History Table / List with Filterable Statuses */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden bg-surface/90">
        {/* Header with Search & Filter Tabs */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <span>SUBMISSION HISTORY & LIVE TRACKER</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {filteredSubmissions.length} RESULTS
              </span>
            </h2>
            <p className="text-xs text-white/60 font-sans">
              Filterable status pipeline updating live with Supabase Realtime
            </p>
          </div>

          {/* Controls: Search + Status Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search track, artist, playlist..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
              {[
                { id: 'all', label: 'All', count: userSubmissions.length },
                { id: 'pending', label: 'Pending', count: metrics.pending },
                { id: 'approved', label: 'Approved', count: metrics.approved },
                { id: 'declined', label: 'Declined', count: metrics.declined }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? 'bg-spotify-green text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      statusFilter === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submissions List / Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
              <Disc3 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold font-display text-white">No submissions found</h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto font-sans">
                {searchQuery
                  ? 'Try searching with a different keyword or reset your status filter.'
                  : 'You have not submitted any tracks under this status yet. Start your first campaign now!'}
              </p>
            </div>
            <button
              onClick={() => openSpotifyWizard()}
              className="px-5 py-2.5 rounded-xl bg-spotify-green text-black font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Submit Spotify Link
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredSubmissions.map((sub) => {
              const isPlaying = audioState.isPlaying && audioState.currentTrack?.id === sub.track.id;
              const isApproved = sub.status === 'approved' || sub.status === 'added_to_playlist';
              const isPending = sub.status === 'pending';
              const isDeclined = sub.status === 'declined';

              return (
                <div
                  key={sub.id}
                  className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* Left: Track artwork + title + audio trigger */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative group flex-shrink-0">
                      <img
                        src={sub.track.albumArt}
                        alt={sub.track.title}
                        className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-sm"
                      />
                      <button
                        onClick={() => handleToggleAudio(sub)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center text-white transition-opacity cursor-pointer"
                        title={isPlaying ? 'Pause' : 'Play audio sample'}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-spotify-green" />
                        ) : (
                          <Play className="w-5 h-5 text-spotify-green ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-display text-white truncate max-w-[200px] sm:max-w-[300px]">
                          {sub.track.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-mono border border-white/10">
                          {sub.track.genre}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                            sub.pitchType === 'premium'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {sub.pitchType === 'premium' ? 'Priority' : 'Free'}
                        </span>
                      </div>

                      <div className="text-xs text-white/60 font-sans truncate">
                        {sub.artistName}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono mt-1">
                        <span>Submitted {new Date(sub.submittedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <a
                          href={sub.track.spotifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-spotify-green hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Spotify</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Target Playlist & Curator info */}
                  <div className="w-full lg:w-64 flex-shrink-0 text-left lg:text-left text-xs space-y-0.5">
                    <span className="text-white/40 text-[10px] uppercase font-mono block">
                      Target Playlist
                    </span>
                    <div className="text-white font-semibold font-display truncate">
                      {sub.playlistTitle}
                    </div>
                    <div className="text-white/60 text-[11px] truncate">
                      Curated by {sub.curatorName}
                    </div>
                  </div>

                  {/* Right: Status Pill & Realtime Actions */}
                  <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end w-full lg:w-auto">
                    {/* Status Badge */}
                    <div>
                      {isApproved && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-display font-semibold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approved & Live</span>
                        </div>
                      )}

                      {isPending && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-display font-semibold">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span>Pending Review</span>
                        </div>
                      )}

                      {isDeclined && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10 text-white/70 text-xs font-display font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-white/40" />
                          <span>Declined / Feedback</span>
                        </div>
                      )}
                    </div>

                    {/* View Details / Feedback */}
                    <button
                      onClick={() => setSelectedSubmissionDetails(sub)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-display font-semibold transition-colors cursor-pointer"
                    >
                      Details & Pitch
                    </button>

                    {/* Interactive Realtime Demo Controller for Testing */}
                    {isPending && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSimulateRealtimeDecision(sub, 'approve')}
                          title="Simulate Curator Approval via Supabase Realtime"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          ✓ Test Approve
                        </button>
                        <button
                          onClick={() => handleSimulateRealtimeDecision(sub, 'decline')}
                          title="Simulate Curator Decline via Supabase Realtime"
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Submission Details & Curator Pitch Note Modal */}
      {selectedSubmissionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl p-6 relative overflow-hidden bg-surface/95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <span>SUBMISSION DETAILS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white/60">
                  ID: {selectedSubmissionDetails.id.slice(0, 10)}
                </span>
              </h3>
              <button
                onClick={() => setSelectedSubmissionDetails(null)}
                className="text-white/50 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedSubmissionDetails.track.albumArt}
                  alt={selectedSubmissionDetails.track.title}
                  className="w-16 h-16 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <div className="text-sm font-bold font-display text-white">
                    {selectedSubmissionDetails.track.title}
                  </div>
                  <div className="text-xs text-white/60">
                    {selectedSubmissionDetails.artistName}
                  </div>
                  <div className="text-[11px] text-spotify-green font-mono mt-1">
                    Target: {selectedSubmissionDetails.playlistTitle}
                  </div>
                </div>
              </div>

              {/* Pitch Note */}
              <div>
                <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">
                  Artist Pitch Note
                </label>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 font-sans italic">
                  "{selectedSubmissionDetails.customMessage || 'No pitch note provided.'}"
                </div>
              </div>

              {/* Curator Feedback if available */}
              {selectedSubmissionDetails.feedbackTags && selectedSubmissionDetails.feedbackTags.length > 0 && (
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">
                    Curator Review Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubmissionDetails.feedbackTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-spotify-green/15 border border-spotify-green/30 text-spotify-green text-xs font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmissionDetails.feedbackNote && (
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">
                    Curator Written Note
                  </label>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 font-sans">
                    {selectedSubmissionDetails.feedbackNote}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedSubmissionDetails(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-display font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
