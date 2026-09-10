import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  X,
  Mail,
  Lock,
  User,
  Music2,
  Radio,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    connectSpotifyOAuth
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('artist');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (authModalMode === 'login') {
        if (!email) {
          setErrorMsg('Please enter your email');
          setIsLoading(false);
          return;
        }
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in. Please try again.');
        }
      } else {
        if (!email || !name) {
          setErrorMsg('Name and email are required');
          setIsLoading(false);
          return;
        }
        const res = await register(name, email, role, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPassword = 'password123') => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await login(demoEmail, demoPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Quick login failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="card-sane w-full max-w-md rounded-2xl border border-[#333] shadow-2xl p-6 relative overflow-hidden bg-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background ambient red glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#BE1E2F]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-1">
            <BrandLogo size={46} />
          </div>
          <h3 className="text-xl font-bold font-title tracking-wider text-white">
            {authModalMode === 'login' ? 'SIGN IN TO SUBMIT PLUG' : 'CREATE YOUR ACCOUNT'}
          </h3>
          <p className="text-xs text-white/60 font-mono-code">
            {authModalMode === 'login'
              ? 'Access real-time Spotify playlist pitching & curator review deck'
              : 'Join independent artists and tastemakers on the live music grid'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-xl bg-[#1c1c1c] p-1 border border-[#2b2b2b] mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-title tracking-wider rounded-lg transition-all cursor-pointer ${
              authModalMode === 'login'
                ? 'bg-[#BE1E2F] text-white font-bold shadow-md shadow-[#BE1E2F]/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-title tracking-wider rounded-lg transition-all cursor-pointer ${
              authModalMode === 'register'
                ? 'bg-[#BE1E2F] text-white font-bold shadow-md shadow-[#BE1E2F]/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono-code flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#BE1E2F] flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-mono-code text-white/70 mb-1.5 font-bold">
                  FULL NAME / ARTIST MONIKER
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sane Low Label or Sarah Chen"
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#BE1E2F]"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-mono-code text-white/70 mb-1.5 font-bold">
                  I AM JOINING AS
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('artist')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'artist'
                        ? 'border-[#BE1E2F] bg-[#BE1E2F]/10 text-white'
                        : 'border-[#333] bg-[#1c1c1c] text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Music2 className="w-4 h-4 text-[#BE1E2F]" />
                      <span className="text-xs font-bold font-title">ARTIST</span>
                    </div>
                    <div className="text-[10px] text-white/50 leading-tight">Pitch songs to playlists</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('curator')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'curator'
                        ? 'border-[#BE1E2F] bg-[#BE1E2F]/10 text-white'
                        : 'border-[#333] bg-[#1c1c1c] text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className="w-4 h-4 text-[#BE1E2F]" />
                      <span className="text-xs font-bold font-title">CURATOR</span>
                    </div>
                    <div className="text-[10px] text-white/50 leading-tight">Review & manage playlists</div>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono-code text-white/70 mb-1.5 font-bold">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#BE1E2F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono-code text-white/70 mb-1.5 font-bold">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1c1c1c] border border-[#333] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#BE1E2F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-sane py-3 rounded-xl text-xs font-title font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#BE1E2F]/25 cursor-pointer"
          >
            {isLoading ? (
              <span className="animate-pulse">AUTHENTICATING...</span>
            ) : authModalMode === 'login' ? (
              <>
                <span>LOG IN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>CREATE ACCOUNT</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="mt-5 pt-4 border-t border-[#262626] space-y-2">
          <div className="text-[10px] font-mono-code text-white/40 text-center uppercase tracking-wider">
            Quick 1-Click Persona Sign In
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('SanelowLabel@gmail.com')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-[#BE1E2F]">
                <Music2 className="w-3.5 h-3.5 text-[#BE1E2F]" />
                <span className="truncate">Sane Low Label</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono-code">Artist (25 Credits)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sarah@echowaves.com')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-[#BE1E2F]">
                <Radio className="w-3.5 h-3.5 text-[#BE1E2F]" />
                <span className="truncate">Sarah Chen</span>
              </div>
              <div className="text-[10px] text-amber-400 font-mono-code">Verified Curator</div>
            </button>
          </div>
        </div>

        {/* Spotify Connect Alternate */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setAuthModalOpen(false);
              connectSpotifyOAuth();
            }}
            className="w-full py-2.5 rounded-xl bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 text-[#1DB954] text-xs font-mono-code font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONNECT WITH SPOTIFY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
