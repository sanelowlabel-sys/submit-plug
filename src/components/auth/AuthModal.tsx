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
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { UserRole } from '../../types';
import { SUPABASE_PROJECT_URL } from '../../lib/supabase';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    resetPassword
  } = useApp();

  // Mode: 'login' | 'register' | 'forgot_password'
  const [activeForm, setActiveForm] = useState<'login' | 'register' | 'forgot_password'>(
    authModalMode === 'register' ? 'register' : 'login'
  );

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('artist');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync with context prop if changed
  React.useEffect(() => {
    setActiveForm(authModalMode === 'register' ? 'register' : 'login');
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (activeForm === 'login') {
        if (!email.trim() || !password.trim()) {
          setErrorMsg('Email and password are required');
          setIsLoading(false);
          return;
        }

        const res = await login(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in. Please verify your email and password.');
        }
      } else if (activeForm === 'register') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setErrorMsg('Please complete all required fields');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (!agreeTerms) {
          setErrorMsg('Please accept the Terms of Service to continue');
          setIsLoading(false);
          return;
        }

        const res = await register(name.trim(), email.trim(), role, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account. Please try again.');
        }
      } else if (activeForm === 'forgot_password') {
        if (!email.trim()) {
          setErrorMsg('Please enter your email address');
          setIsLoading(false);
          return;
        }

        const res = await resetPassword(email.trim());
        if (res.success) {
          setSuccessMsg(res.message || 'Password reset link sent to your email.');
        } else {
          setErrorMsg(res.message || 'Failed to request password reset');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = async (demoEmail: string, demoPassword = 'password123', demoRole: UserRole = 'artist') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await login(demoEmail, demoPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Demo sign-in failed');
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
        className="glass-panel w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-7 relative overflow-hidden bg-surface/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient emerald backlight */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-spotify-green/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Brand Logo */}
        <div className="text-center space-y-2 mb-5">
          <div className="flex justify-center mb-1">
            <BrandLogo size={46} />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-display tracking-wider text-white">
            {activeForm === 'login' && 'SIGN IN TO PLAYLIST PLUG'}
            {activeForm === 'register' && 'CREATE YOUR ACCOUNT'}
            {activeForm === 'forgot_password' && 'RESET YOUR PASSWORD'}
          </h3>

          <p className="text-xs text-white/60 font-sans">
            {activeForm === 'login' && 'Real-time Spotify submission pipeline & curator network'}
            {activeForm === 'register' && 'Join independent artists and tastemakers on the live music grid'}
            {activeForm === 'forgot_password' && 'Enter your email to receive Supabase Auth recovery instructions'}
          </p>
        </div>

        {/* Distinct Mode Tabs (Login vs Register) */}
        {activeForm !== 'forgot_password' ? (
          <div className="flex rounded-2xl bg-black/40 p-1 border border-white/10 mb-5">
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => {
                setActiveForm('login');
                setAuthModalMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
                activeForm === 'login'
                  ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              id="auth-tab-register"
              onClick={() => {
                setActiveForm('register');
                setAuthModalMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
                activeForm === 'register'
                  ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveForm('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="inline-flex items-center gap-1 text-xs text-spotify-green hover:underline font-sans mb-4 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        )}

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-sans flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-sans flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM VIEW 1: STANDARD LOGIN */}
        {activeForm === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-sans text-white/70 font-semibold">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveForm('forgot_password');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-spotify-green hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/60 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-spotify-green rounded"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="login-submit-btn"
              className="w-full py-3.5 bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-spotify-green/20 cursor-pointer transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span className="animate-pulse">AUTHENTICATING VIA SUPABASE...</span>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Credentials for Reviewers */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-[10px] text-white/40 font-mono text-center uppercase tracking-wider mb-2">
                Fast-Access Demo Accounts
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('artist@submitplug.com', 'password123', 'artist')}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Music2 className="w-3.5 h-3.5 text-spotify-green" />
                  <span>Artist Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('curator@submitplug.com', 'password123', 'curator')}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-spotify-green" />
                  <span>Curator Demo</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* FORM VIEW 2: USER REGISTRATION */}
        {activeForm === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                FULL NAME / ARTIST MONIKER
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  id="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Lin or SoundWave Records"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                />
              </div>
            </div>

            {/* Account Role Cards */}
            <div>
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                I AM JOINING AS
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('artist')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'artist'
                      ? 'border-spotify-green bg-spotify-green/10 text-white shadow-sm shadow-spotify-green/20'
                      : 'border-white/10 bg-black/30 text-white/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Music2 className="w-4 h-4 text-spotify-green" />
                    <span className="text-xs font-bold font-display">ARTIST</span>
                  </div>
                  <div className="text-[10px] text-white/50 leading-tight font-sans">
                    Pitch Spotify links & manage releases
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('curator')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'curator'
                      ? 'border-spotify-green bg-spotify-green/10 text-white shadow-sm shadow-spotify-green/20'
                      : 'border-white/10 bg-black/30 text-white/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Radio className="w-4 h-4 text-spotify-green" />
                    <span className="text-xs font-bold font-display">CURATOR</span>
                  </div>
                  <div className="text-[10px] text-white/50 leading-tight font-sans">
                    List playlists & review submissions
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    id="register-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                  CONFIRM
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    id="register-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-[11px] text-white/60 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 accent-spotify-green rounded mt-0.5"
              />
              <span>
                I agree to the Playlist Plug Terms of Service & organic submission rules.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              id="register-submit-btn"
              className="w-full py-3.5 bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-spotify-green/20 cursor-pointer transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span className="animate-pulse">CREATING SUPABASE ACCOUNT...</span>
              ) : (
                <>
                  <span>COMPLETE REGISTRATION</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORM VIEW 3: FORGOT PASSWORD */}
        {activeForm === 'forgot_password' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                YOUR REGISTERED EMAIL
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-spotify-green/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? 'DISPATCHING RECOVERY EMAIL...' : 'SEND PASSWORD RESET LINK'}
            </button>
          </form>
        )}

        {/* Supabase Engine Status Badge */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
            <span>Supabase Auth Engine</span>
          </div>
          <span className="truncate max-w-[170px]" title={SUPABASE_PROJECT_URL}>
            nnrcrrgtndknswjwrlzp
          </span>
        </div>
      </div>
    </div>
  );
};
