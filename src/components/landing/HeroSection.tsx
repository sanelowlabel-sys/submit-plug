import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Radio,
  Music2,
  TrendingUp,
  CheckCircle2,
  Play,
  ArrowRight,
  Shield,
  Zap,
  Headphones,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

export const HeroSection: React.FC = () => {
  const {
    openPitchModal,
    setActiveTab,
    switchUserRole,
    setOnboardPlaylistModalOpen,
    playTrack,
    playlists
  } = useApp();

  const [quickSpotifyUrl, setQuickSpotifyUrl] = useState('');

  const handleQuickPitch = (e: React.FormEvent) => {
    e.preventDefault();
    openPitchModal();
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#BE1E2F]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#BE1E2F]/10 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Top Tagline Pill */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2b2b2b] border border-[#3a3a3a] text-xs text-white/90 shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-[#BE1E2F] animate-ping" />
            <span className="font-mono-code font-medium">NEXT-GEN SPOTIFY PLAYLIST PLUG</span>
            <span className="text-white/40">|</span>
            <span className="text-[#BE1E2F] font-bold">100% ORGANIC CURATION</span>
          </motion.div>
        </div>

        {/* Hero Title & Subtext */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-title tracking-tight text-white leading-none"
          >
            GET YOUR MUSIC ON <br />
            <span className="text-[#BE1E2F]">VERIFIED SPOTIFY</span> PLAYLISTS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto font-sans leading-relaxed"
          >
            Directly connect with high-impact tastemakers, electronic labels, and indie curators.
            Choose <strong className="text-white">Free Spotlight Pitches</strong> or <strong className="text-white">Guaranteed 48h Premium Reviews</strong> with actionable feedback.
          </motion.p>
        </div>

        {/* Quick Search / Paste URL Action Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <form
            onSubmit={handleQuickPitch}
            className="card-sane p-2 flex flex-col sm:flex-row gap-2 shadow-2xl border border-[#3a3a3a] hover:border-[#BE1E2F]/60 transition-all rounded-2xl"
          >
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3.5 text-[#BE1E2F]">
                <Music2 className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={quickSpotifyUrl}
                onChange={e => setQuickSpotifyUrl(e.target.value)}
                placeholder="Paste Spotify Track link or search artist / song..."
                className="w-full bg-[#1a1a1a] text-white pl-11 pr-4 py-3 rounded-xl border border-[#3a3a3a] text-sm focus:outline-none focus:border-[#BE1E2F] font-mono-code placeholder:text-white/40"
              />
            </div>
            <button
              type="submit"
              className="btn-sane px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-lg shadow-[#BE1E2F]/25"
            >
              <Sparkles className="w-4 h-4" />
              PITCH YOUR SONG
            </button>
          </form>

          {/* Quick CTAs for Curators */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs font-mono-code text-white/60">
            <span>Are you a playlist curator?</span>
            <button
              onClick={() => {
                switchUserRole('curator');
                setOnboardPlaylistModalOpen(true);
              }}
              className="text-[#BE1E2F] hover:text-white hover:underline flex items-center gap-1 font-bold"
            >
              Submit My Playlist <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* Live Platform Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          <div className="card-sane p-4 sm:p-5 rounded-xl border border-[#3a3a3a] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#BE1E2F]/15 flex items-center justify-center text-[#BE1E2F]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-title leading-tight">148,920+</div>
              <div className="text-xs text-white/60 font-mono-code">Total Pitches Sent</div>
            </div>
          </div>

          <div className="card-sane p-4 sm:p-5 rounded-xl border border-[#3a3a3a] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#BE1E2F]/15 flex items-center justify-center text-[#BE1E2F]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-title leading-tight">4,280+</div>
              <div className="text-xs text-white/60 font-mono-code">Active Playlists</div>
            </div>
          </div>

          <div className="card-sane p-4 sm:p-5 rounded-xl border border-[#3a3a3a] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-title leading-tight">94.2%</div>
              <div className="text-xs text-white/60 font-mono-code">Curator Response Rate</div>
            </div>
          </div>

          <div className="card-sane p-4 sm:p-5 rounded-xl border border-[#3a3a3a] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-title leading-tight">$184,500+</div>
              <div className="text-xs text-white/60 font-mono-code">Curator Rewards Paid</div>
            </div>
          </div>
        </motion.div>

        {/* Featured Live Playlists Teaser */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-title tracking-wider text-white flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#BE1E2F]" />
                FEATURED SPOTIFY PLAYLISTS
              </h3>
              <p className="text-xs text-white/60 font-mono-code">
                Verified tastemakers currently accepting submissions with under 24h response times
              </p>
            </div>
            <button
              onClick={() => setActiveTab('marketplace')}
              className="text-xs font-mono-code text-[#BE1E2F] hover:text-white flex items-center gap-1 font-bold"
            >
              View All 4,280+ <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {playlists.slice(0, 3).map(playlist => (
              <div
                key={playlist.id}
                className="card-sane p-4 rounded-xl border border-[#3a3a3a] hover:border-[#BE1E2F] transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-[#3a3a3a]">
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
                        <Play className="w-5 h-5 text-white fill-current" />
                      </button>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate font-title">{playlist.title}</h4>
                      {playlist.isVerified && (
                        <Shield className="w-3.5 h-3.5 text-[#BE1E2F] flex-shrink-0 fill-[#BE1E2F]/20" />
                      )}
                    </div>
                    <div className="text-xs text-white/60 truncate font-mono-code">{playlist.curatorName}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-mono-code text-white/70">
                      <span className="text-emerald-400 font-bold">{(playlist.followerCount).toLocaleString()} followers</span>
                      <span>•</span>
                      <span>{playlist.approvalRate}% accept</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#3a3a3a] flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {playlist.genres.slice(0, 2).map(g => (
                      <span key={g} className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[10px] font-mono-code text-white/70 border border-[#3a3a3a]">
                        {g}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => openPitchModal(playlist)}
                    className="btn-sane text-[11px] px-3 py-1 rounded-md font-bold cursor-pointer"
                  >
                    Pitch Song
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
