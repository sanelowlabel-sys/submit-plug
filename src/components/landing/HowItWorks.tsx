import React, { useState } from 'react';
import { Music2, Radio, CheckCircle2, Sparkles, Clock, ArrowRight, ShieldCheck, Coins, Headphones } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HowItWorks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'artist' | 'curator'>('artist');
  const { openPitchModal, setOnboardPlaylistModalOpen, switchUserRole } = useApp();

  const artistSteps = [
    {
      num: '01',
      title: 'SELECT PLAYLISTS',
      desc: 'Browse 4,000+ genre-specific Spotify playlists filtered by follower count, approval rate, and curator response speed.',
      icon: <Radio className="w-6 h-6 text-[#BE1E2F]" />,
      badge: 'Marketplace Discovery'
    },
    {
      num: '02',
      title: 'CHOOSE PITCH TYPE',
      desc: 'Submit for FREE by listening to 30 seconds of the curator\'s spotlight track, or use 1-2 credits for Guaranteed 48-Hour Review.',
      icon: <Sparkles className="w-6 h-6 text-[#BE1E2F]" />,
      badge: 'Free or Premium'
    },
    {
      num: '03',
      title: 'GET ADDED & DISCOVERED',
      desc: 'Receive live notifications when your track is approved. Approved tracks are synced directly into the live Spotify playlist.',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      badge: 'Live Spotify Sync'
    }
  ];

  const curatorSteps = [
    {
      num: '01',
      title: 'CONNECT SPOTIFY PLAYLIST',
      desc: 'Onboard your playlists with 1-click Spotify OAuth. Submit Plug automatically fetches follower counts, track counts, and genres.',
      icon: <Headphones className="w-6 h-6 text-[#BE1E2F]" />,
      badge: 'Instant Sync'
    },
    {
      num: '02',
      title: 'LISTEN & REVIEW IN STUDIO DECK',
      desc: 'Stream high-res 30-sec track previews with built-in waveform player. 1-click Approve adds track directly to your Spotify playlist.',
      icon: <Clock className="w-6 h-6 text-[#BE1E2F]" />,
      badge: 'Streamlined DAW Deck'
    },
    {
      num: '03',
      title: 'EARN REWARDS & GROW',
      desc: 'Earn credit rewards and cash payouts for providing constructive, timely feedback. Grow your playlist organic listener engagement.',
      icon: <Coins className="w-6 h-6 text-amber-400" />,
      badge: 'Curator Monetization'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#3a3a3a] bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2b2b2b] text-[11px] font-mono-code text-[#BE1E2F] border border-[#3a3a3a] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            STREAMLINED WORKFLOW
          </div>
          <h2 className="text-3xl sm:text-4xl font-title tracking-tight text-white">
            HOW SUBMIT PLUG WORKS
          </h2>
          <p className="text-sm text-white/60 font-sans mt-2">
            A transparent, organic submission pipeline engineered for independent creators and professional tastemakers.
          </p>

          {/* Toggle Switch */}
          <div className="inline-flex p-1 rounded-xl bg-[#2b2b2b] border border-[#3a3a3a] mt-6">
            <button
              onClick={() => setActiveTab('artist')}
              className={`px-5 py-2 rounded-lg text-xs font-title tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'artist'
                  ? 'bg-[#BE1E2F] text-white shadow-md shadow-[#BE1E2F]/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Music2 className="w-4 h-4" />
              FOR MUSIC ARTISTS
            </button>
            <button
              onClick={() => setActiveTab('curator')}
              className={`px-5 py-2 rounded-lg text-xs font-title tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'curator'
                  ? 'bg-[#BE1E2F] text-white shadow-md shadow-[#BE1E2F]/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              FOR PLAYLIST CURATORS
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(activeTab === 'artist' ? artistSteps : curatorSteps).map((step, idx) => (
            <div
              key={step.num}
              className="card-sane p-6 rounded-xl border border-[#3a3a3a] hover:border-[#BE1E2F] transition-all flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#3a3a3a] flex items-center justify-center group-hover:border-[#BE1E2F] transition-colors">
                    {step.icon}
                  </div>
                  <span className="font-title text-2xl font-bold text-white/20 group-hover:text-[#BE1E2F] transition-colors">
                    {step.num}
                  </span>
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded bg-[#1a1a1a] text-[10px] font-mono-code text-[#BE1E2F] border border-[#3a3a3a] mb-2 font-bold">
                  {step.badge}
                </div>

                <h3 className="text-lg font-title tracking-wide text-white mb-2">
                  {step.title}
                </h3>

                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#3a3a3a]/60 text-[11px] font-mono-code text-white/40 flex items-center justify-between">
                <span>Step {idx + 1} of 3</span>
                <span className="text-white/60 group-hover:text-[#BE1E2F] transition-colors">Active Pipeline →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA for Active Tab */}
        <div className="mt-10 text-center">
          {activeTab === 'artist' ? (
            <button
              onClick={() => openPitchModal()}
              className="btn-sane px-8 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-[#BE1E2F]/20 cursor-pointer"
            >
              START PITCHING YOUR TRACK NOW
            </button>
          ) : (
            <button
              onClick={() => {
                switchUserRole('curator');
                setOnboardPlaylistModalOpen(true);
              }}
              className="btn-sane px-8 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-[#BE1E2F]/20 cursor-pointer"
            >
              CONNECT SPOTIFY PLAYLIST TO REVIEW QUEUE
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
