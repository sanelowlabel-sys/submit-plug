import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Submission, Playlist } from '../../types';
import {
  ListMusic,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Plus,
  Coins,
  Clock,
  Radio,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  Volume2,
  SkipForward,
  RotateCcw,
  Sliders,
  AlertCircle,
  UserPlus,
  Heart,
  BarChart3
} from 'lucide-react';
import { DashboardAnalyticsCharts } from '../common/DashboardAnalyticsCharts';

export const CuratorDashboard: React.FC = () => {
  const {
    currentUser,
    curatorInboxSubmissions,
    reviewSubmission,
    userPlaylists,
    togglePlaylistStatus,
    setOnboardPlaylistModalOpen,
    audioState,
    playTrack,
    pauseTrack,
    curatorActivities
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inbox' | 'playlists' | 'growth' | 'analytics' | 'verification'>('inbox');
  const [selectedSubForReview, setSelectedSubForReview] = useState<Submission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'decline' | null>(null);
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const pendingSubmissions = curatorInboxSubmissions.filter(s => s.status === 'pending');
  const completedSubmissions = curatorInboxSubmissions.filter(s => s.status !== 'pending');

  const availableTags = [
    'Vocal Production',
    'Mixing & Mastering',
    'Arrangement',
    'Doesn’t Fit Playlist Vibe',
    'Great Sound Design',
    'Strong Energy',
    'Too Commercial',
    'Too Underground'
  ];

  const handleOpenReviewModal = (sub: Submission, action: 'approve' | 'decline') => {
    setSelectedSubForReview(sub);
    setReviewAction(action);
    setFeedbackTags(action === 'approve' ? ['Great Sound Design', 'Strong Energy'] : ['Doesn’t Fit Playlist Vibe']);
    setCustomNote('');
  };

  const handleConfirmReview = async () => {
    if (!selectedSubForReview || !reviewAction) return;

    setIsSubmittingReview(true);
    await reviewSubmission(
      selectedSubForReview.id,
      reviewAction,
      feedbackTags,
      customNote || (reviewAction === 'approve' ? 'Added into current rotation!' : 'Good track, just not fitting our sound palette.')
    );
    setIsSubmittingReview(false);

    setSelectedSubForReview(null);
    setReviewAction(null);
  };

  const toggleFeedbackTag = (tag: string) => {
    setFeedbackTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Curator Header Banner */}
      <div className="card-sane p-6 sm:p-7 rounded-2xl border border-[#3a3a3a] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-emerald-600 text-[9px] font-mono-code text-white rounded font-bold uppercase">
              CURATOR
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-title text-white">{currentUser.name}</h1>
              {currentUser.verifiedStatus && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono-code font-bold flex items-center gap-1 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED CURATOR
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 font-mono-code mt-0.5 max-w-lg truncate">
              {currentUser.bio}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code text-white/50 mt-2">
              <span>{userPlaylists.length} Connected Spotify Playlists</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">100% Real-Time Push Active</span>
            </div>
          </div>
        </div>

        {/* Action Right */}
        <div className="flex items-center gap-3">
          <div className="card-panel px-4 py-2.5 rounded-xl border border-[#3a3a3a] flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-[10px] text-white/50 font-mono-code">SUBMISSION CREDITS</div>
              <div className="text-xs font-bold font-mono-code text-white">
                {currentUser.creditBalance} Credits
              </div>
            </div>
          </div>

          <button
            onClick={() => setOnboardPlaylistModalOpen(true)}
            className="btn-sane text-xs px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#BE1E2F]/30 hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-4 h-4" />
            SUBMIT PLAYLIST
          </button>
        </div>
      </div>

      {/* Hero Curator Action Banner */}
      <div className="card-sane p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-[#14231b] via-[#1a1a1a] to-[#1a1a1a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono-code text-emerald-400 font-bold">
            <Radio className="w-4 h-4" />
            <span>CURATOR ONBOARDING & INGESTION</span>
          </div>
          <h2 className="text-xl font-title font-bold text-white">
            SUBMIT PLAYLIST WITH DEDICATED WIZARD
          </h2>
          <p className="text-xs text-white/60 font-mono-code max-w-2xl leading-relaxed">
            Curators can choose when they accept free or premium submissions, set exact credit pricing (1 to 10+ credits), and configure Spotify follower & track save gates.
          </p>
        </div>
        <button
          onClick={() => setOnboardPlaylistModalOpen(true)}
          className="btn-sane text-xs px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xl shadow-[#BE1E2F]/30 whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white border-none"
        >
          <Plus className="w-4 h-4" />
          SUBMIT PLAYLIST WIZARD
        </button>
      </div>

      {/* Curator Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>PENDING INBOX</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-title text-amber-300 mt-1">
            {pendingSubmissions.length}
          </div>
          <div className="text-[10px] text-amber-400/60 font-mono-code mt-0.5">Awaiting Review</div>
        </div>

        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>REVIEWED TRACKS</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-title text-white mt-1">
            {completedSubmissions.length}
          </div>
          <div className="text-[10px] text-white/40 font-mono-code mt-0.5">Processed Pitches</div>
        </div>

        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>TOTAL REACH</span>
            <Radio className="w-3.5 h-3.5 text-[#BE1E2F]" />
          </div>
          <div className="text-2xl font-bold font-title text-white mt-1">
            {userPlaylists.reduce((acc, p) => acc + p.followerCount, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-white/40 font-mono-code mt-0.5">Across All Playlists</div>
        </div>

        <div className="card-sane p-4 rounded-xl border border-[#3a3a3a]">
          <div className="text-[11px] text-white/50 font-mono-code flex items-center justify-between">
            <span>RESPONSE SPEED</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-title text-emerald-400 mt-1">
            ~18h
          </div>
          <div className="text-[10px] text-emerald-400/60 font-mono-code mt-0.5">Guaranteed 48h Window</div>
        </div>
      </div>

      {/* Curator Tabs */}
      <div className="flex border-b border-[#3a3a3a] space-x-6 text-sm font-title">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'inbox' ? 'text-white border-b-2 border-[#BE1E2F]' : 'text-white/50 hover:text-white'
          }`}
        >
          <span>SUBMISSION INBOX</span>
          {pendingSubmissions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#BE1E2F] text-[10px] text-white font-mono-code">
              {pendingSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'playlists' ? 'text-white border-b-2 border-[#BE1E2F]' : 'text-white/50 hover:text-white'
          }`}
        >
          <span>MY PLAYLISTS</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#2b2b2b] text-[10px] text-white/60 font-mono-code">
            {userPlaylists.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('growth')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'growth' ? 'text-white border-b-2 border-[#BE1E2F]' : 'text-white/50 hover:text-white'
          }`}
        >
          <span>GROWTH & GATES</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono-code font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics' ? 'text-white border-b-2 border-[#BE1E2F]' : 'text-white/50 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#BE1E2F]" />
          <span>ANALYTICS & CHARTS</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'verification' ? 'text-white border-b-2 border-[#BE1E2F]' : 'text-white/50 hover:text-white'
          }`}
        >
          <span>VERIFICATION</span>
        </button>
      </div>

      {/* TAB 1: Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <div className="card-sane p-12 text-center rounded-2xl border border-[#3a3a3a] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#2b2b2b] flex items-center justify-center mx-auto text-white/50">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-title text-white">INBOX ZERO ACHIEVED</h3>
              <p className="text-xs text-white/60 font-mono-code max-w-md mx-auto">
                You have reviewed all incoming pitches. New pitches will appear here dynamically in real-time as artists submit them!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map(sub => {
                const isPlaying = audioState.currentTrack?.id === sub.track.id && audioState.isPlaying;

                return (
                  <div
                    key={sub.id}
                    className="card-sane p-5 rounded-2xl border border-[#3a3a3a] space-y-4 hover:border-[#BE1E2F]/40 transition-all shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Track Info & Play Button */}
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <img
                            src={sub.track.albumArt}
                            alt={sub.track.title}
                            className="w-16 h-16 rounded-xl object-cover border border-[#3a3a3a]"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => {
                              if (isPlaying) {
                                pauseTrack();
                              } else {
                                playTrack(sub.track, sub.playlistTitle);
                              }
                            }}
                            className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                          >
                            {isPlaying ? (
                              <Pause className="w-6 h-6 fill-current" />
                            ) : (
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold font-title text-white">
                              {sub.track.title}
                            </h4>
                            {sub.pitchType === 'premium' ? (
                              <span className="px-2 py-0.5 rounded bg-[#BE1E2F] text-white text-[10px] font-mono-code font-bold">
                                PREMIUM PITCH ⭐
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono-code font-bold border border-emerald-500/40">
                                FREE GATE PITCH
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-white/70 font-mono-code mt-0.5">
                            Artist: {sub.artistName} • Target: <strong className="text-white">{sub.playlistTitle}</strong>
                          </div>

                          <div className="text-[11px] text-white/40 font-mono-code mt-1">
                            Genre: {sub.track.genre} • BPM: {sub.track.bpm || 124} • Key: {sub.track.key || 'G Minor'}
                          </div>
                        </div>
                      </div>

                      {/* Right: Review Action Buttons */}
                      <div className="flex items-center gap-3">
                        <a
                          href={sub.track.spotifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-[#1a1a1a] border border-[#3a3a3a] text-white/60 hover:text-white hover:border-[#BE1E2F] cursor-pointer"
                          title="Open Spotify Track Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleOpenReviewModal(sub, 'decline')}
                          className="px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/60 transition-colors text-xs font-mono-code font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" /> Decline with Feedback
                        </button>

                        <button
                          onClick={() => handleOpenReviewModal(sub, 'approve')}
                          className="btn-sane text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#BE1E2F]/20"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve & Add to Playlist
                        </button>
                      </div>
                    </div>

                    {/* Artist Pitch Note */}
                    {sub.customMessage && (
                      <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#3a3a3a] text-xs font-mono-code text-white/80">
                        <span className="text-[#BE1E2F] font-bold">Artist Pitch Note: </span>
                        "{sub.customMessage}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Managed Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-title text-white">YOUR CONNECTED SPOTIFY PLAYLISTS</h3>
              <p className="text-xs text-white/60 font-mono-code">
                Configure submission intake, free pitch settings, and credit fees.
              </p>
            </div>
            <button
              onClick={() => setOnboardPlaylistModalOpen(true)}
              className="btn-sane text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Connect Playlist URI
            </button>
          </div>

          {userPlaylists.length === 0 ? (
            <div className="card-sane p-10 text-center rounded-2xl border border-[#3a3a3a] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#BE1E2F]/15 text-[#BE1E2F] flex items-center justify-center mx-auto">
                <ListMusic className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-title font-bold text-white">NO PLAYLISTS SUBMITTED YET</h4>
                <p className="text-xs text-white/60 font-mono-code max-w-md mx-auto mt-1">
                  Upload your first verified Spotify playlist using our dedicated wizard. You can configure free submissions, premium pitch fees, and follow gates.
                </p>
              </div>
              <button
                onClick={() => setOnboardPlaylistModalOpen(true)}
                className="btn-sane text-xs px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#BE1E2F]/25"
              >
                <Plus className="w-4 h-4" /> SUBMIT PLAYLIST WIZARD
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPlaylists.map(pl => (
              <div
                key={pl.id}
                className="card-sane p-5 rounded-2xl border border-[#3a3a3a] space-y-4 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={pl.coverArt}
                      alt={pl.title}
                      className="w-14 h-14 rounded-xl object-cover border border-[#3a3a3a]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm font-bold font-title text-white truncate max-w-[200px]">
                        {pl.title}
                      </h4>
                      <div className="text-xs text-white/60 font-mono-code">
                        {pl.followerCount.toLocaleString()} Followers • {pl.trackCount} Tracks
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] font-mono-code text-white/60">
                        {pl.acceptingSubmissions ? 'Active' : 'Paused'}
                      </span>
                      <input
                        type="checkbox"
                        checked={pl.acceptingSubmissions}
                        onChange={() => togglePlaylistStatus(pl.id)}
                        className="w-4 h-4 accent-[#BE1E2F]"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#1a1a1a] p-3 rounded-xl border border-[#3a3a3a] text-center text-xs font-mono-code">
                  <div>
                    <div className="text-white/40 text-[10px]">PITCH FEE</div>
                    <div className="font-bold text-white mt-0.5">{pl.pitchCostCredits} Credit</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[10px]">FREE PITCH</div>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {pl.freePitchEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[10px]">ACCEPTANCE</div>
                    <div className="font-bold text-amber-300 mt-0.5">{pl.approvalRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* TAB 3: Growth & Curator Benefits */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="card-panel p-6 rounded-2xl border border-[#3a3a3a] space-y-4">
            <div>
              <span className="text-xs font-mono-code text-emerald-400 font-bold">
                ORGANIC PLAYLIST GROWTH ENGINE
              </span>
              <h3 className="text-2xl font-title text-white mt-1">
                FOLLOWER GATES CONVERSION ANALYTICS
              </h3>
              <p className="text-xs text-white/60 font-mono-code mt-1 max-w-2xl">
                Curators grow their Spotify ecosystem on Submit Plug through verified artist actions: Every free pitch requires artists to follow your Spotify profile, follow your playlist, and save your featured spotlight tracks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#141414] p-4 rounded-xl border border-[#333]">
                <div className="text-white/50 text-xs font-mono-code flex items-center justify-between">
                  <span>CURATOR SPOTIFY FOLLOWS</span>
                  <UserPlus className="w-4 h-4 text-[#1DB954]" />
                </div>
                <div className="text-3xl font-bold font-title text-white mt-2">+432</div>
                <div className="text-[10px] text-emerald-400 font-mono-code mt-1">
                  100% Real Spotify Users
                </div>
              </div>

              <div className="bg-[#141414] p-4 rounded-xl border border-[#333]">
                <div className="text-white/50 text-xs font-mono-code flex items-center justify-between">
                  <span>PLAYLIST FOLLOWERS GAINED</span>
                  <Radio className="w-4 h-4 text-[#1DB954]" />
                </div>
                <div className="text-3xl font-bold font-title text-white mt-2">+1,890</div>
                <div className="text-[10px] text-emerald-400 font-mono-code mt-1">
                  Direct Library Additions
                </div>
              </div>

              <div className="bg-[#141414] p-4 rounded-xl border border-[#333]">
                <div className="text-white/50 text-xs font-mono-code flex items-center justify-between">
                  <span>FEATURED SONGS SAVED</span>
                  <Heart className="w-4 h-4 text-[#BE1E2F]" />
                </div>
                <div className="text-3xl font-bold font-title text-white mt-2">+645</div>
                <div className="text-[10px] text-emerald-400 font-mono-code mt-1">
                  Boosts Algorithmic Reach
                </div>
              </div>
            </div>
          </div>

          {/* Platform Submission Credits Reward Section */}
          <div className="card-sane p-6 rounded-2xl border border-[#3a3a3a] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-title text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  PLATFORM SUBMISSION CREDITS
                </h4>
                <p className="text-xs text-white/60 font-mono-code mt-1">
                  For every verified review you complete, you receive platform credits that allow you to pitch your own releases or affiliate label tracks for free across the entire network.
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-mono-code text-white">
                  {currentUser.creditBalance} Credits Available
                </div>
                <div className="text-[11px] text-emerald-400 font-mono-code">
                  Zero Cash Fees Required
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Verification Status */}
      {activeTab === 'verification' && (
        <div className="card-sane p-6 sm:p-8 rounded-2xl border border-[#3a3a3a] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#3a3a3a]">
            <div>
              <h3 className="text-base font-title text-white">CURATOR VERIFICATION STATUS</h3>
              <p className="text-xs text-white/60 font-mono-code">
                Verified curators receive top ranking on the marketplace and increased artist pitches.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono-code font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" /> VERIFIED BADGE ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-code">
            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#3a3a3a]">
              <div className="text-white/50">FOLLOWERS AUDIT</div>
              <div className="text-lg font-bold text-white mt-1">45,000+</div>
              <div className="text-emerald-400 text-[10px] mt-0.5">✓ Meets 1,000 min requirement</div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#3a3a3a]">
              <div className="text-white/50">RESPONSE SPEED</div>
              <div className="text-lg font-bold text-amber-300 mt-1">18 Hours</div>
              <div className="text-emerald-400 text-[10px] mt-0.5">✓ Meets 48h max threshold</div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#3a3a3a]">
              <div className="text-white/50">ORGANIC INTEGRITY</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">100% Clean</div>
              <div className="text-emerald-400 text-[10px] mt-0.5">✓ Zero bot activity detected</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Analytics & Charts */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <DashboardAnalyticsCharts role="curator" />
        </div>
      )}

      {/* Review Feedback Modal */}
      {selectedSubForReview && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card-sane w-full max-w-lg rounded-2xl border border-[#3a3a3a] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#3a3a3a]">
              <div className="text-base font-title text-white flex items-center gap-2">
                {reviewAction === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                {reviewAction === 'approve' ? 'APPROVE & ADD TO PLAYLIST' : 'DECLINE WITH FEEDBACK'}
              </div>
              <button
                onClick={() => {
                  setSelectedSubForReview(null);
                  setReviewAction(null);
                }}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-xl border border-[#3a3a3a]">
              <img
                src={selectedSubForReview.track.albumArt}
                alt={selectedSubForReview.track.title}
                className="w-12 h-12 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-bold text-white text-xs">{selectedSubForReview.track.title}</div>
                <div className="text-[11px] text-white/60 font-mono-code">
                  by {selectedSubForReview.artistName} for {selectedSubForReview.playlistTitle}
                </div>
              </div>
            </div>

            {/* Constructive Feedback Tag Chooser */}
            <div className="space-y-2">
              <label className="text-xs font-mono-code text-white/80 block">
                Select Constructive Feedback Tags:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => {
                  const isSelected = feedbackTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFeedbackTag(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono-code transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#BE1E2F] text-white font-bold'
                          : 'bg-[#1a1a1a] text-white/70 border border-[#3a3a3a] hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono-code text-white/80 block">
                Curator Note to Artist:
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Optional feedback or compliments on their sound design..."
                className="w-full bg-[#1a1a1a] text-white p-3 rounded-xl border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
              />
            </div>

            <div className="pt-3 border-t border-[#3a3a3a] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubForReview(null);
                  setReviewAction(null);
                }}
                className="text-xs font-mono-code text-white/60 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleConfirmReview}
                className="btn-sane text-xs px-5 py-2.5 rounded-xl font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReview ? 'Sending Real-Time Decision...' : 'Confirm Review & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
