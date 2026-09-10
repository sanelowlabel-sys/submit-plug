import React from 'react';
import {
  ShieldCheck,
  Music2,
  Radio,
  CheckCircle2,
  User,
  Sparkles,
  Server,
  Lock,
  ArrowUpRight,
  Headphones,
  Sliders,
  Flame,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  const { setActiveTab, switchUserRole, openPitchModal, setOnboardPlaylistModalOpen } = useApp();

  return (
    <footer className="bg-[#0e0e0e] border-t border-[#262626] text-white/80 pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-24 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[250px] bg-[#BE1E2F]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Feature / Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#141414] border border-[#262626]">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-title tracking-wider">REAL-TIME INGESTION</div>
              <div className="text-[11px] text-white/50 font-mono-code">Playlists & submissions synced dynamically</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 border-t md:border-t-0 md:border-l border-[#262626]">
            <div className="w-9 h-9 rounded-xl bg-[#BE1E2F]/15 text-[#BE1E2F] flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-title tracking-wider">48-HOUR SLA ENGINE</div>
              <div className="text-[11px] text-white/50 font-mono-code">Guaranteed review turnaround or credits refund</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 border-t md:border-t-0 md:border-l border-[#262626]">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-title tracking-wider">ANTI-PAYOLA COMPLIANCE</div>
              <div className="text-[11px] text-white/50 font-mono-code">100% Organic listening time compensation</div>
            </div>
          </div>
        </div>

        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <BrandLogo size={38} />
              <div>
                <span className="text-lg font-bold font-title tracking-wider text-white">SUBMIT PLUG</span>
                <div className="text-[10px] text-[#BE1E2F] font-mono-code font-bold tracking-widest leading-none">
                  SANE LOW LABEL ECOSYSTEM
                </div>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Next-generation direct-to-curator gateway connecting independent producers, record labels, and tastemakers with verified Spotify editorial audiences.
            </p>
            <div className="pt-2 flex flex-col gap-1.5 text-[11px] font-mono-code text-white/40">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Node Cluster: Live • Ingress: 3000</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#BE1E2F]" />
                <span>Spotify Web API v1: Operational</span>
              </div>
            </div>
          </div>

          {/* For Artists */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-title tracking-wider text-white flex items-center gap-2">
              <Music2 className="w-3.5 h-3.5 text-[#BE1E2F]" />
              FOR ARTISTS
            </h4>
            <ul className="space-y-2 text-xs font-mono-code text-white/65">
              <li>
                <button
                  onClick={() => openPitchModal()}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-[#BE1E2F] font-bold"
                >
                  <Sparkles className="w-3 h-3" /> Pitch Track Now
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    switchUserRole('artist');
                    setActiveTab('marketplace');
                  }}
                  className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
                >
                  Browse Real-Time Playlists
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    switchUserRole('artist');
                    setActiveTab('artist');
                  }}
                  className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
                >
                  Artist Hub & Campaigns
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    switchUserRole('artist');
                    setActiveTab('dashboard');
                  }}
                  className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
                >
                  Streaming Analytics & Charts
                </button>
              </li>
            </ul>
          </div>

          {/* For Curators */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-title tracking-wider text-white flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#BE1E2F]" />
              FOR CURATORS
            </h4>
            <ul className="space-y-2 text-xs font-mono-code text-white/65">
              <li>
                <button
                  onClick={() => {
                    switchUserRole('curator');
                    setOnboardPlaylistModalOpen(true);
                  }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-emerald-400 font-bold"
                >
                  <Sliders className="w-3 h-3" /> Submit Playlist Wizard
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    switchUserRole('curator');
                    setActiveTab('curator');
                  }}
                  className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
                >
                  Curator Hub & Review Deck
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    switchUserRole('curator');
                    setActiveTab('curator');
                  }}
                  className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
                >
                  Free vs Premium Gate Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                  }}
                  className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
                >
                  Curator Verification & Badging
                </button>
              </li>
            </ul>
          </div>

          {/* Spotify Compliance & Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-title tracking-wider text-white flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#BE1E2F]" />
              TERMS & GOVERNANCE
            </h4>
            <p className="text-[11px] text-white/55 leading-relaxed font-mono-code">
              Submit Plug adheres strictly to the Spotify Platform Rules. Credits and fees compensate curators purely for their professional critique and dedicated listening time. Organic placement is guaranteed never to be bought or sold.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#1c1c1c] text-[10px] font-mono-code text-emerald-400 border border-[#2b2b2b]">
                100% Organic Curation
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#1c1c1c] text-[10px] font-mono-code text-white/70 border border-[#2b2b2b]">
                No Bot Traffic
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Telemetry, Brand Logo and Links */}
        <div className="pt-8 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between text-xs text-white/45 font-mono-code gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group"
              title="Submit Plug Home"
            >
              <BrandLogo size={28} withBadge={false} alt="Brand Logo" />
              <span className="font-title font-bold text-white tracking-wider text-xs">SUBMIT PLUG</span>
            </button>
            <span className="text-white/20">|</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
            <span className="hidden lg:inline text-white/20">|</span>
            <span className="hidden lg:inline text-white/40">Sane Low Label Ecosystem</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 text-[11px]">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('marketplace')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Explore
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('profile')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <User className="w-3 h-3" /> Account Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
