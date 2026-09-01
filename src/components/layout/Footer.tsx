import React from 'react';
import { ShieldCheck, Music2, Radio, CheckCircle, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  const { setActiveTab, switchUserRole } = useApp();

  return (
    <footer className="bg-[#141414] border-t border-[#3a3a3a] text-white/80 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand Col */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <span className="text-xl font-bold font-title tracking-wider text-white">SUBMIT PLUG</span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed font-mono-code">
            The premier direct-to-curator submission platform for independent music producers, bands, and record labels. Powered by Sane Low Label ecosystem.
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs font-mono-code text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>REAL-TIME SPOTIFY SYNC ACTIVE</span>
          </div>
        </div>

        {/* Quick Links for Artists */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-title tracking-wider text-white flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5 text-[#BE1E2F]" />
            FOR ARTISTS
          </h4>
          <ul className="space-y-2 text-xs font-mono-code text-white/70">
            <li>
              <button
                onClick={() => {
                  switchUserRole('artist');
                  setActiveTab('marketplace');
                }}
                className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
              >
                Browse Playlists
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
                Campaign Tracker
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
                Free Spotlight Pitch
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
                Credit Bundles
              </button>
            </li>
          </ul>
        </div>

        {/* Quick Links for Curators */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-title tracking-wider text-white flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#BE1E2F]" />
            FOR CURATORS
          </h4>
          <ul className="space-y-2 text-xs font-mono-code text-white/70">
            <li>
              <button
                onClick={() => {
                  switchUserRole('curator');
                  setActiveTab('curator');
                }}
                className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
              >
                Review Inbox Deck
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
                Connect Spotify Playlists
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
                Curator Earnings & Rewards
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('profile');
                }}
                className="hover:text-[#BE1E2F] transition-colors cursor-pointer"
              >
                Apply for Verification
              </button>
            </li>
          </ul>
        </div>

        {/* Platform Compliance & Security */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-title tracking-wider text-white flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#BE1E2F]" />
            SPOTIFY COMPLIANCE
          </h4>
          <p className="text-[11px] text-white/60 leading-relaxed font-mono-code">
            Submit Plug strictly complies with the Spotify Developer Policy. Credits and fees compensate curators solely for their professional listening time and constructive feedback. Guaranteed placements are never sold.
          </p>
          <div className="text-[11px] font-mono-code text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> 100% Organic Curation
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-[#3a3a3a]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 font-mono-code gap-4">
        <div>
          © {new Date().getFullYear()} Submit Plug. Developed with Sane Low Label ecosystem.
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className="hover:text-[#BE1E2F] transition-colors cursor-pointer flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5" /> Profile & Account Settings
          </button>
          <span>•</span>
          <span className="text-white/40">Spotify Web API Connected</span>
          <span>•</span>
          <span className="text-white/40">Instant Real-Time Sync</span>
        </div>
      </div>
    </footer>
  );
};
