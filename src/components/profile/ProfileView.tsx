import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  User,
  ShieldCheck,
  Coins,
  CheckCircle2,
  Lock,
  Save,
  Radio,
  Clock,
  LogIn,
  Trash2,
  AlertTriangle,
  FileText,
  RotateCcw
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    activeRole,
    switchUserRole,
    updateUserProfile,
    artistSubmissions,
    userPlaylists,
    setBuyCreditsModalOpen,
    setActiveTab,
    freeWeeklyCredits,
    openLoginModal,
    openRegisterModal,
    deleteAccount,
    openLegalModal
  } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [spotifyId, setSpotifyId] = useState(currentUser?.spotifyId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'security' | 'danger'>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setSpotifyId(currentUser.spotifyId || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
        <div className="flex justify-center">
          <BrandLogo size={68} alt="Brand Logo" />
        </div>
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4 bg-surface">
          <h2 className="text-2xl font-bold font-display text-white tracking-wider">
            AUTHENTICATION REQUIRED
          </h2>
          <p className="text-sm text-white/60 font-sans max-w-md mx-auto">
            Please sign in with your Supabase credentials to manage your profile, view submissions, and access your personal dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => openLoginModal()}
              className="w-full sm:w-auto h-11 px-6 rounded-xl font-display font-bold text-xs bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              SIGN IN
            </button>
            <button
              onClick={() => openRegisterModal()}
              className="w-full sm:w-auto h-11 px-6 rounded-xl font-display font-bold text-xs bg-surface-hover text-white border border-white/10 hover:border-spotify-green transition-colors cursor-pointer"
            >
              CREATE AN ACCOUNT
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Users cannot edit role or credit balance (Phase 2 server-side authorization)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name: name.trim(),
      bio: bio.trim(),
      spotifyId: spotifyId.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
  };

  const totalPlaced = artistSubmissions.filter(
    s => s.status === 'added_to_playlist' || s.status === 'approved'
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-surface">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={currentUser.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200`}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-spotify-green shadow-xl"
              />
              {currentUser.isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-spotify-green border-2 border-surface flex items-center justify-center text-black"
                  title="Verified User"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
                  {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-xs font-mono font-bold uppercase border border-spotify-green/30">
                  {currentUser.role.toUpperCase()}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold uppercase border border-purple-500/30">
                    ADMIN
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-white/60 font-sans max-w-md">
                {currentUser.email}
              </p>

              {currentUser.bio && (
                <p className="text-xs text-white/50 font-sans italic pt-1 max-w-md">
                  "{currentUser.bio}"
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Wallet Quick Action */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-white/50 font-sans">AVAILABLE CREDITS</div>
                <div className="text-lg font-bold font-display text-spotify-green">
                  {currentUser.creditBalance} <span className="text-xs text-white/40">credits</span>
                </div>
              </div>
              <button
                onClick={() => setBuyCreditsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold font-display cursor-pointer"
              >
                Top Up
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-surface-hover/50 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Submissions Sent</div>
            <div className="text-xl font-bold font-display text-white mt-1">
              {artistSubmissions.length}
            </div>
          </div>

          <div className="bg-surface-hover/50 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Placements Won</div>
            <div className="text-xl font-bold font-display text-spotify-green mt-1">
              {totalPlaced}
            </div>
          </div>

          <div className="bg-surface-hover/50 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Free Weekly Pitches</div>
            <div className="text-xl font-bold font-display text-white mt-1">
              {freeWeeklyCredits} / 2
            </div>
          </div>

          <div className="bg-surface-hover/50 p-4 rounded-2xl border border-white/5">
            <div className="text-xs text-white/50 font-sans">Playlists Listed</div>
            <div className="text-xl font-bold font-display text-white mt-1">
              {userPlaylists.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-black/40 p-1.5 border border-white/10 gap-2 max-w-md">
        <button
          onClick={() => setActiveSubTab('details')}
          className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'details'
              ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          PROFILE SETTINGS
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
              : 'text-white/60 hover:text-white'
          }`}
        >
          GOVERNANCE & RLS
        </button>

        <button
          onClick={() => setActiveSubTab('danger')}
          className={`flex-1 py-2 text-xs font-display font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'danger'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          DELETE ACCOUNT
        </button>
      </div>

      {/* SUB TAB 1: Edit Profile Details */}
      {activeSubTab === 'details' && (
        <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-surface">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-display font-bold text-white">EDIT USER INFORMATION</h3>
              <p className="text-xs text-white/60 font-sans">
                Update your public profile, moniker, and biography.
              </p>
            </div>

            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-sans bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Supabase
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                ARTIST / CURATOR NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-hover border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                EMAIL ADDRESS (SUPABASE AUTH)
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white/50 font-mono cursor-not-allowed"
                title="Email is locked to your verified Supabase Auth identity"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                SPOTIFY USER / ARTIST ID
              </label>
              <input
                type="text"
                value={spotifyId}
                onChange={(e) => setSpotifyId(e.target.value)}
                placeholder="e.g. 4cOdK2wGLETKBW3PvgPWqT"
                className="w-full bg-surface-hover border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-sans text-white/70 mb-1.5 font-semibold">
                BIOGRAPHY & SOUND DIRECTION
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell curators and listeners about your musical journey, genre specializations, and influences..."
                className="w-full bg-surface-hover border border-white/10 rounded-xl p-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-spotify-green/20"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      )}

      {/* SUB TAB 2: Governance & Security */}
      {activeSubTab === 'security' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-surface">
          <div>
            <h3 className="text-base font-display font-bold text-white">DATABASE SECURITY & ROW LEVEL SECURITY</h3>
            <p className="text-xs text-white/60 font-sans">
              Playlist Plug operates on Supabase Postgres with strict Row Level Security (RLS) enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-spotify-green" />
                Row Level Security (RLS)
              </div>
              <p className="text-xs text-white/60">
                You can only view and edit your own profile and pitches. Other users cannot access your private pitch drafts or credit wallet ledger.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-spotify-green" />
                Server-Side Authorization
              </div>
              <p className="text-xs text-white/60">
                All submissions and credit top-ups verify cryptographic Supabase JWT signatures. User roles and balances are never trusted from client payloads.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
            <button
              onClick={() => openLegalModal('terms')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-spotify-green" />
              <span>Terms of Service</span>
            </button>
            <button
              onClick={() => openLegalModal('privacy')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-spotify-green" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => openLegalModal('refund')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-spotify-green" />
              <span>48h SLA Refund Policy</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB TAB 3: Account Deletion Flow (Phase 6) */}
      {activeSubTab === 'danger' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/20 space-y-6 bg-surface">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">PERMANENT ACCOUNT DELETION</h3>
              <p className="text-xs text-white/60 font-sans mt-1 leading-relaxed">
                Deleting your account will permanently purge your profile, remove your listed Spotify playlists, archive your pitch submissions, and invalidate active sessions. This action cannot be undone.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Request Account Deletion
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-3">
              <p className="text-xs text-rose-200 font-sans font-bold">
                Are you absolutely sure you want to permanently delete your account ({currentUser.email})?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting Data...' : 'Yes, Permanently Delete My Account'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
