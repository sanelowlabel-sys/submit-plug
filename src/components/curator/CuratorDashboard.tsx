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
  DollarSign,
  AlertCircle
} from 'lucide-react';

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
    pauseTrack
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inbox' | 'playlists' | 'earnings' | 'verification'>('inbox');
  const [selectedSubForReview, setSelectedSubForReview] = useState<Submission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'decline' | null>(null);
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [payoutRequested, setPayoutRequested] = useState(false);

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

  const handleConfirmReview = () => {
    if (!selectedSubForReview || !reviewAction) return;

    reviewSubmission(
      selectedSubForReview.id,
      reviewAction,
      feedbackTags,
      customNote || (reviewAction === 'approve' ? 'Added into current rotation!' : 'Good track, just not fitting our sound palette.')
    );

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
              <span className="text-emerald-400 font-bold">100% On-Time Response Guarantee</span>
            </div>
          </div>
        </div>

        {/* Action Right */}
        <div className="flex items-center gap-3">
          <div className="card-panel px-4 py-2.5 rounded-xl border border-[#3a3a3a] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] text-white/50 font-mono-code">AVAILABLE PAYOUT</div>
              <div className="text-xs font-bold font-mono-code text-emerald-400">
                ${currentUser.earningsBalance.toFixed(2)} USD
              </div>
            </div>
          </div>

          <button
            onClick={() => setOnboardPlaylistModalOpen(true)}
            className="btn-sane text-xs px-5 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#BE1E2F]/20"
          >
            <Plus className="w-4 h-4" />
            CONNECT PLAYLIST
          </button>
        </div>
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
            <span>CURATOR REPUTATION</span>
            <Sparkles className="w-3.5 h-3.5 text-[#BE1E2F]" />
          </div>
          <div className="text-2xl font-bold font-title text-emerald-400 mt-1">
            99.4%
          </div>
          <div className="text-[10px] text-emerald-400/60 font-mono-code mt-0.5">18h Average Response</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#3a3a3a] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'inbox'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          STUDIO REVIEW INBOX ({pendingSubmissions.length})
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'playlists'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          MANAGED PLAYLISTS ({userPlaylists.length})
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'earnings'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          EARNINGS & STRIPE PAYOUTS
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 rounded-lg text-xs font-title tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'verification'
              ? 'bg-[#BE1E2F] text-white font-bold'
              : 'text-white/60 hover:text-white card-panel'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          CURATOR VERIFICATION STATUS
        </button>
      </div>

      {/* TAB 1: Studio Review Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <div className="card-sane p-12 text-center rounded-2xl border border-[#3a3a3a]">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-title text-white">Your review inbox is all caught up!</h3>
              <p className="text-xs text-white/60 font-mono-code mt-1">
                New pitches from artists will appear here automatically in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingSubmissions.map(sub => {
                const isPlayingThis =
                  audioState.isPlaying && audioState.currentTrack?.id === sub.track.id;

                return (
                  <div
                    key={sub.id}
                    className="card-sane p-6 rounded-2xl border border-[#3a3a3a] hover:border-[#BE1E2F] transition-all space-y-4 shadow-xl"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Track Details */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#3a3a3a]">
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
                              <Pause className="w-6 h-6 fill-current text-[#BE1E2F]" />
                            ) : (
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold font-title text-white">
                              {sub.track.title}
                            </h3>
                            {sub.pitchType === 'premium' ? (
                              <span className="px-2 py-0.5 rounded bg-[#BE1E2F]/20 text-[#BE1E2F] text-[10px] font-mono-code font-bold border border-[#BE1E2F]/40">
                                PREMIUM ⭐ ($1.25 Payout)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono-code font-bold border border-emerald-500/40">
                                FREE SPOTLIGHT
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
                          className="p-2.5 rounded-xl bg-[#1a1a1a] border border-[#3a3a3a] text-white/60 hover:text-white hover:border-[#BE1E2F]"
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
        </div>
      )}

      {/* TAB 3: Earnings & Payouts */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="card-panel p-6 rounded-2xl border border-[#3a3a3a] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono-code text-emerald-400 font-bold">CURATOR REVENUE POOL</div>
              <div className="text-3xl font-bold font-title text-white mt-1">
                ${currentUser.earningsBalance.toFixed(2)} USD
              </div>
              <p className="text-xs text-white/60 font-mono-code mt-1">
                You earn $1.25 USD for every verified premium pitch review completed on time.
              </p>
            </div>

            <button
              disabled={currentUser.earningsBalance < 10 || payoutRequested}
              onClick={() => {
                setPayoutRequested(true);
                setTimeout(() => setPayoutRequested(false), 5000);
              }}
              className={`btn-sane text-xs px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#BE1E2F]/20 ${
                currentUser.earningsBalance < 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {payoutRequested ? 'Payout Initiated to Stripe!' : 'REQUEST STRIPE PAYOUT (Min $10)'}
            </button>
          </div>

          <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#3a3a3a] space-y-3">
            <h4 className="text-xs font-title tracking-wider text-white">STRIPE CONNECT STATUS</h4>
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="text-white/60">Payout Destination:</span>
              <strong className="text-emerald-400">Direct Deposit / Stripe Express Connected</strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="text-white/60">Auto-Payout Frequency:</span>
              <span className="text-white">Every Monday (Weekly)</span>
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
                className="text-white/60 hover:text-white"
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
                onClick={handleConfirmReview}
                className="btn-sane text-xs px-5 py-2.5 rounded-xl font-bold cursor-pointer"
              >
                Confirm Review & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
