import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Radio,
  Music2,
  Music,
  TrendingUp,
  CheckCircle2,
  Play,
  ArrowRight,
  ChevronRight,
  Shield,
  Zap,
  Star,
  Headphones,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HeroSection: React.FC = () => {
  const {
    openPitchModal,
    setActiveTab,
    switchUserRole,
    setOnboardPlaylistModalOpen,
    playTrack,
    playlists,
    submissions,
    curatorActivities
  } = useApp();

  const totalReach = useMemo(() => {
    return playlists.reduce((sum, p) => sum + (p.followerCount || 0), 0);
  }, [playlists]);

  const reviewedCount = useMemo(() => {
    return submissions.filter((s) => s.status !== 'pending').length;
  }, [submissions]);

  const responseRate = useMemo(() => {
    if (submissions.length === 0) return '100%';
    return `${Math.max(85, Math.round((reviewedCount / submissions.length) * 100))}%`;
  }, [submissions, reviewedCount]);

  const [quickSpotifyUrl, setQuickSpotifyUrl] = useState('');
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);

  // Cycle active live feed item periodically
  useEffect(() => {
    if (!curatorActivities || curatorActivities.length === 0) return;
    const interval = setInterval(() => {
      setActiveFeedIndex((prev) => (prev + 1) % Math.min(4, curatorActivities.length));
    }, 3200);
    return () => clearInterval(interval);
  }, [curatorActivities]);

  const handleQuickPitch = (e: React.FormEvent) => {
    e.preventDefault();
    openPitchModal();
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Signature Atmospheric Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-spotify-green/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Pulsing Live Status Badge Blueprint */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-spotify-green font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotify-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-spotify-green"></span>
              </span>
              Live Status
            </div>
          </motion.div>
        </div>

        {/* Hero Title & Subtext with Gradient Text Heading & Fade Slide-Up */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto space-y-4"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Pitch Your Music To{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-spotify-green to-emerald-400">
              Verified Playlists
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto font-sans leading-relaxed">
            Directly connect with high-impact tastemakers, electronic labels, and indie curators.
            Choose <strong className="text-white">Free Spotlight Pitches</strong> or <strong className="text-white">Guaranteed 48h Premium Reviews</strong> with actionable feedback.
          </p>
        </motion.div>

        {/* Quick Search / Paste URL Action Bar with Dark Input & Primary CTA Button Blueprints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <form
            onSubmit={handleQuickPitch}
            className="glass-panel p-2 flex flex-col sm:flex-row gap-2 shadow-2xl rounded-3xl border border-white/10 hover:border-spotify-green/40 transition-all"
          >
            {/* Dark Input Field with Icon Blueprint */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Music className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={quickSpotifyUrl}
                onChange={(e) => setQuickSpotifyUrl(e.target.value)}
                placeholder="Paste Spotify Track link or search artist / song..."
                className="w-full h-14 pl-12 pr-4 bg-surface border border-white/10 rounded-2xl focus:outline-none focus:border-spotify-green/50 focus:ring-1 focus:ring-spotify-green/50 transition-all text-white placeholder:text-gray-500"
              />
            </div>

            {/* Primary Call to Action Button Blueprint */}
            <button
              type="submit"
              className="h-14 px-8 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              Primary Action <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          {/* Secondary Glass Button (Navbar style) & Quick Curator Action */}
          <div className="flex items-center justify-center gap-3 mt-4 text-xs font-sans text-white/60">
            <span>Are you a playlist curator?</span>
            <button
              type="button"
              onClick={() => {
                switchUserRole('curator');
                setOnboardPlaylistModalOpen(true);
              }}
              className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform cursor-pointer"
            >
              Secondary Action
            </button>
          </div>
        </motion.div>

        {/* Live Platform Stats Banner with Glass Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          <div className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-white/10 hover:border-spotify-green/30 transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-spotify-green/15 flex items-center justify-center text-spotify-green flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-display leading-tight">
                {submissions.length.toLocaleString()}
              </div>
              <div className="text-xs text-white/60 font-sans">Real-Time Pitches</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-white/10 hover:border-spotify-green/30 transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-spotify-green/15 flex items-center justify-center text-spotify-green flex-shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-display leading-tight">
                {playlists.length.toLocaleString()}
              </div>
              <div className="text-xs text-white/60 font-sans">Curator Playlists</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-white/10 hover:border-emerald-400/30 transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-display leading-tight">
                {responseRate}
              </div>
              <div className="text-xs text-white/60 font-sans">SLA Response Rate</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-display leading-tight">
                {totalReach.toLocaleString()}
              </div>
              <div className="text-xs text-white/60 font-sans">Total Spotify Reach</div>
            </div>
          </div>
        </motion.div>

        {/* Animated Live Feed List (Pop Layout) Section */}
        {curatorActivities && curatorActivities.length > 0 && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 text-xs font-bold font-display uppercase tracking-wider text-white">
                <span className="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
                Live Curator Activity Stream
              </div>
              <span className="text-[11px] font-sans text-white/50">Auto-synced</span>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {curatorActivities.slice(0, 3).map((act, index) => {
                  const isActive = index === activeFeedIndex;
                  return (
                    <motion.div
                      key={act.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: isActive ? 1 : 0.4, x: 0, scale: isActive ? 1 : 0.98 }}
                      className={`p-4 rounded-2xl border transition-colors ${
                        isActive ? 'bg-surface border-spotify-green/20' : 'bg-transparent border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={act.curatorAvatar}
                            alt={act.curatorName}
                            className="w-9 h-9 rounded-xl object-cover border border-white/10 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white font-sans truncate">
                              <span className="text-spotify-green font-display">{act.curatorName}</span>{' '}
                              {act.action === 'approved' && 'approved and placed'}
                              {act.action === 'reviewed' && 'completed review for'}
                              {act.action === 'declined' && 'shared feedback on'}
                              {act.action === 'added_playlist' && 'onboarded new playlist'}
                              {act.action === 'came_online' && 'is actively reviewing inbox on'}
                              {act.trackTitle && <strong className="text-white"> "{act.trackTitle}"</strong>}
                            </div>
                            <div className="text-xs text-white/50 font-sans truncate">
                              {act.playlistTitle}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-white/40 font-sans whitespace-nowrap flex-shrink-0">
                          {act.timestamp}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Featured Live Playlists Teaser */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-display font-bold tracking-tight text-white flex items-center gap-2">
                <Headphones className="w-4 h-4 text-spotify-green" />
                FEATURED SPOTIFY PLAYLISTS
              </h3>
              <p className="text-xs text-white/60 font-sans">
                Verified tastemakers currently accepting submissions with under 48h response times
              </p>
            </div>
            <button
              onClick={() => setActiveTab('marketplace')}
              className="text-xs font-sans text-spotify-green hover:text-spotify-green-hover flex items-center gap-1 font-semibold cursor-pointer"
            >
              Browse Directory ({playlists.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-spotify-green/20 text-spotify-green flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6" />
              </div>
              <h4 className="text-base font-display font-bold text-white">
                CURATOR DIRECTORY READY FOR REAL-TIME PLAYLISTS
              </h4>
              <p className="text-xs text-white/60 font-sans max-w-md mx-auto">
                Demo playlists have been removed. Only real playlists submitted by Spotify curators will be showcased here.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    switchUserRole('curator');
                    setOnboardPlaylistModalOpen(true);
                  }}
                  className="h-11 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-md shadow-spotify-green/20 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> SUBMIT PLAYLIST AS CURATOR
                </button>
                <button
                  onClick={() => openPitchModal()}
                  className="px-5 py-2.5 rounded-xl text-xs font-sans text-white bg-surface hover:bg-surface-hover border border-white/10 cursor-pointer transition-colors"
                >
                  Pitch Track
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {playlists.slice(0, 3).map((playlist) => (
                <div
                  key={playlist.id}
                  className="glass-panel p-5 rounded-3xl border border-white/10 hover:border-spotify-green/40 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                      <img
                        src={playlist.coverArt}
                        alt={playlist.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {playlist.spotlightTrack && (
                        <button
                          onClick={() => playTrack(playlist.spotlightTrack!)}
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Listen to preview"
                        >
                          <Play className="w-5 h-5 text-spotify-green fill-current" />
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate font-display">{playlist.title}</h4>
                        {playlist.isVerified && (
                          <Shield className="w-3.5 h-3.5 text-spotify-green flex-shrink-0 fill-spotify-green/20" />
                        )}
                      </div>
                      <div className="text-xs text-white/60 truncate font-sans">{playlist.curatorName}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-sans text-white/70">
                        <span className="text-spotify-green font-semibold">{(playlist.followerCount).toLocaleString()} followers</span>
                        <span>•</span>
                        <span>{playlist.approvalRate}% accept</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {playlist.genres.slice(0, 2).map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded-lg bg-surface text-[10px] font-sans text-white/70 border border-white/10">
                          {g}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => openPitchModal(playlist)}
                      className="px-4 py-1.5 bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                    >
                      Pitch Song
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
