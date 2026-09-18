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
      desc: 'Browse real-time, genre-specific Spotify playlists uploaded by verified curators and filtered by followers and SLA response times.',
      icon: <Radio className="w-6 h-6 text-spotify-green" />,
      badge: 'Real-Time Discovery'
    },
    {
      num: '02',
      title: 'CHOOSE PITCH TYPE',
      desc: 'Submit for FREE via curator social gates, or use curator-selected credits (1-10 CR) for Guaranteed 48-Hour Review and detailed feedback.',
      icon: <Sparkles className="w-6 h-6 text-spotify-green" />,
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
      desc: 'Onboard your playlists with 1-click Spotify OAuth. Playlist Plug automatically fetches follower counts, track counts, and genres.',
      icon: <Headphones className="w-6 h-6 text-spotify-green" />,
      badge: 'Instant Sync'
    },
    {
      num: '02',
      title: 'LISTEN & REVIEW IN STUDIO DECK',
      desc: 'Stream high-res 30-sec track previews with built-in waveform player. 1-click Approve adds track directly to your Spotify playlist.',
      icon: <Clock className="w-6 h-6 text-spotify-green" />,
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-[#121212] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Glowing Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-spotify-green font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotify-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-spotify-green"></span>
            </span>
            <span className="font-sans">Streamlined Workflow</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white">
            HOW PLAYLIST PLUG WORKS
          </h2>
          <p className="text-base text-white/60 font-sans mt-3 max-w-xl mx-auto">
            A transparent, organic submission pipeline engineered for independent creators and professional tastemakers.
          </p>

          {/* Toggle Switch */}
          <div className="inline-flex p-1.5 rounded-2xl bg-surface border border-white/10 mt-8">
            <button
              onClick={() => setActiveTab('artist')}
              className={`px-6 py-2.5 rounded-xl text-xs font-display font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'artist'
                  ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Music2 className="w-4 h-4" />
              FOR MUSIC ARTISTS
            </button>
            <button
              onClick={() => setActiveTab('curator')}
              className={`px-6 py-2.5 rounded-xl text-xs font-display font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'curator'
                  ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              FOR PLAYLIST CURATORS
            </button>
          </div>
        </div>

        {/* Steps Grid with Glass Cards Pattern */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(activeTab === 'artist' ? artistSteps : curatorSteps).map((step, idx) => (
            <div
              key={step.num}
              className="glass-panel rounded-3xl p-8 relative overflow-hidden border border-white/10 hover:border-spotify-green/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-spotify-green/40 group-hover:bg-spotify-green/10 transition-colors">
                    {step.icon}
                  </div>
                  <span className="font-display text-3xl font-bold text-white/20 group-hover:text-spotify-green transition-colors">
                    {step.num}
                  </span>
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-white/5 text-xs font-sans text-spotify-green border border-white/10 mb-3 font-semibold">
                  {step.badge}
                </div>

                <h3 className="text-xl font-display font-bold text-white mb-2 tracking-tight">
                  {step.title}
                </h3>

                <p className="text-sm text-white/70 leading-relaxed font-sans">
                  {step.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-xs font-sans text-white/40 flex items-center justify-between">
                <span>Step {idx + 1} of 3</span>
                <span className="text-white/60 group-hover:text-spotify-green transition-colors font-medium">
                  Active Pipeline →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA for Active Tab - Primary CTA Button Pattern */}
        <div className="mt-12 text-center">
          {activeTab === 'artist' ? (
            <button
              onClick={() => openPitchModal()}
              className="h-14 px-8 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors mx-auto cursor-pointer shadow-xl shadow-spotify-green/20"
            >
              <Sparkles className="w-5 h-5 text-black" />
              <span>START PITCHING YOUR TRACK NOW</span>
            </button>
          ) : (
            <button
              onClick={() => {
                switchUserRole('curator');
                setOnboardPlaylistModalOpen(true);
              }}
              className="h-14 px-8 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors mx-auto cursor-pointer shadow-xl shadow-spotify-green/20"
            >
              <Radio className="w-5 h-5 text-black" />
              <span>CONNECT SPOTIFY PLAYLIST TO REVIEW QUEUE</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
