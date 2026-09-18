import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  User,
  ShieldCheck,
  Music2,
  ListMusic,
  Coins,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Lock,
  Save,
  Radio,
  Mail,
  Clock,
  ArrowUpRight,
  LogIn
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
    emailLogs,
    connectSpotifyOAuth,
    freeWeeklyCredits,
    openLoginModal,
    openRegisterModal
  } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [spotifyFollowers, setSpotifyFollowers] = useState(currentUser?.spotifyFollowers || 45000);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'roles' | 'spotify' | 'emails' | 'security'>('details');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setBio(currentUser.bio || '');
      setSpotifyFollowers(currentUser.spotifyFollowers || 45000);
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
            Please sign in to access your artist & curator profile, manage Spotify playlist verifications, and track real-time pitches.
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name,
      email,
      bio,
      spotifyFollowers
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const totalPlaced = artistSubmissions.filter(
    s => s.status === 'added_to_playlist' || s.status === 'approved'
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Banner with Brand Logo */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-spotify-green shadow-xl"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-spotify-green text-[10px] font-sans text-black rounded-full font-bold uppercase shadow">
              {activeRole}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{currentUser.name}</h1>
              {currentUser.verifiedStatus && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-sans font-bold flex items-center gap-1 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> SPOTIFY VERIFIED
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 font-sans max-w-md">{currentUser.email}</p>
            <p className="text-xs text-white/70 font-sans mt-1 italic">"{currentUser.bio}"</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-sans text-white/50">
              <div className="flex items-center gap-1.5">
                <BrandLogo size={20} withBadge={false} alt="Brand Logo" />
                <span>Verified Account</span>
              </div>
              <span>•</span>
              <span>Member since {new Date(currentUser.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="text-spotify-green font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-ping" />
                Real-Time Sync Active
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Right */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setBuyCreditsModalOpen(true)}
            className="w-full sm:w-auto glass-panel px-4 py-3 rounded-2xl border border-white/10 hover:border-spotify-green transition-all flex items-center justify-center gap-2.5 cursor-pointer bg-surface"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-[10px] text-white/50 font-sans">SUBMISSION WALLET</div>
              <div className="text-xs font-bold font-sans text-white">
                {currentUser.creditBalance} Credits <span className="text-spotify-green font-bold">+Top Up</span>
              </div>
            </div>
          </button>

          {activeRole === 'artist' ? (
            <button
              onClick={() => setActiveTab('artist')}
              className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold font-display text-xs bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20 transition-colors"
            >
              <Music2 className="w-4 h-4" />
              Go to Artist Hub
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('curator')}
              className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold font-display text-xs bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20 transition-colors"
            >
              <ListMusic className="w-4 h-4" />
              Go to Curator Portal
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>SPOTIFY REACH</span>
            <Radio className="w-3.5 h-3.5 text-spotify-green" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
            {(currentUser.spotifyFollowers || 45000).toLocaleString()}
          </div>
          <div className="text-[10px] text-white/40 font-sans mt-0.5">Spotify Followers</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>PITCH CAMPAIGNS</span>
            <Music2 className="w-3.5 h-3.5 text-spotify-green" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
            {artistSubmissions.length}
          </div>
          <div className="text-[10px] text-spotify-green/80 font-sans mt-0.5">
            {totalPlaced} Placements Approved
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>MANAGED PLAYLISTS</span>
            <ListMusic className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
            {userPlaylists.length}
          </div>
          <div className="text-[10px] text-amber-400/80 font-sans mt-0.5">Connected Channels</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-surface">
          <div className="text-[11px] text-white/50 font-sans flex items-center justify-between">
            <span>FREE PITCH ALLOWANCE</span>
            <Coins className="w-3.5 h-3.5 text-spotify-green" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-spotify-green mt-1">
            {freeWeeklyCredits} / 2
          </div>
          <div className="text-[10px] text-spotify-green/80 font-sans mt-0.5">Free Pitches this Week</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('details')}
          className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'details'
              ? 'bg-spotify-green text-black font-bold'
              : 'text-white/60 hover:text-white bg-surface-hover'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          ACCOUNT DETAILS
        </button>

        <button
          onClick={() => setActiveSubTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'roles'
              ? 'bg-spotify-green text-black font-bold'
              : 'text-white/60 hover:text-white bg-surface-hover'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          SWITCH PERSONA ({activeRole.toUpperCase()})
        </button>

        <button
          onClick={() => setActiveSubTab('spotify')}
          className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'spotify'
              ? 'bg-spotify-green text-black font-bold'
              : 'text-white/60 hover:text-white bg-surface-hover'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          SPOTIFY CONNECTION & SYNC
        </button>

        <button
          onClick={() => setActiveSubTab('emails')}
          className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'emails'
              ? 'bg-spotify-green text-black font-bold'
              : 'text-white/60 hover:text-white bg-surface-hover'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          DISPATCHED EMAILS ({emailLogs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-spotify-green text-black font-bold'
              : 'text-white/60 hover:text-white bg-surface-hover'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          PREFERENCES & SECURITY
        </button>
      </div>

      {/* SUB TAB 1: Details Form */}
      {activeSubTab === 'details' && (
        <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-surface">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-display font-bold text-white">EDIT PROFILE INFORMATION</h3>
              <p className="text-xs text-white/60 font-sans">
                Update how curators and artists see your identity across Playlist Plug.
              </p>
            </div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-sans font-bold">
                <CheckCircle2 className="w-4 h-4" /> Profile Updated!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-sans text-white/80 block">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-surface-hover text-white px-4 py-2.5 rounded-xl border border-white/10 text-xs font-sans focus:outline-none focus:border-spotify-green transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-sans text-white/80 block">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-surface-hover text-white px-4 py-2.5 rounded-xl border border-white/10 text-xs font-sans focus:outline-none focus:border-spotify-green transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-sans text-white/80 block">Bio & Sound Identity</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full bg-surface-hover text-white p-3 rounded-xl border border-white/10 text-xs font-sans focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-sans text-white/80 block">Spotify Followers Count</label>
              <input
                type="number"
                value={spotifyFollowers}
                onChange={e => setSpotifyFollowers(Number(e.target.value))}
                className="w-full bg-surface-hover text-white px-4 py-2.5 rounded-xl border border-white/10 text-xs font-sans focus:outline-none focus:border-spotify-green transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-sans text-white/80 block">Spotify URI ID</label>
              <input
                type="text"
                disabled
                value={currentUser.spotifyUri || 'spotify:artist:alex_vance'}
                className="w-full bg-surface text-white/50 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-sans cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              className="h-11 px-6 rounded-xl font-display font-bold text-xs bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20 transition-colors"
            >
              <Save className="w-4 h-4" /> Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* SUB TAB 2: Roles Switcher */}
      {activeSubTab === 'roles' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-surface">
          <div>
            <h3 className="text-base font-display font-bold text-white">ACTIVE USER PERSONA</h3>
            <p className="text-xs text-white/60 font-sans">
              Switch your primary workspace mode seamlessly between Artist and Playlist Curator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Artist Mode Card */}
            <div
              onClick={() => switchUserRole('artist')}
              className={`p-6 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                activeRole === 'artist'
                  ? 'bg-spotify-green/10 border-spotify-green ring-1 ring-spotify-green'
                  : 'bg-surface-hover border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-spotify-green flex items-center justify-center text-black font-bold">
                  <Music2 className="w-5 h-5" />
                </div>
                {activeRole === 'artist' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-spotify-green text-black text-[10px] font-sans font-bold">
                    ACTIVE PERSONA
                  </span>
                )}
              </div>

              <h4 className="text-lg font-display font-bold text-white">Artist Persona</h4>
              <p className="text-xs text-white/70 font-sans leading-relaxed">
                Pitch your new songs, view live campaign progress, manage your track catalog, and purchase credits.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  switchUserRole('artist');
                  setActiveTab('artist');
                }}
                className="h-10 px-4 rounded-xl font-bold font-display text-xs w-full mt-2 cursor-pointer bg-spotify-green hover:bg-spotify-green-hover text-black transition-colors"
              >
                Launch Artist Hub
              </button>
            </div>

            {/* Curator Mode Card */}
            <div
              onClick={() => switchUserRole('curator')}
              className={`p-6 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                activeRole === 'curator'
                  ? 'bg-spotify-green/10 border-spotify-green ring-1 ring-spotify-green'
                  : 'bg-surface-hover border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-spotify-green border border-spotify-green/40">
                  <ListMusic className="w-5 h-5" />
                </div>
                {activeRole === 'curator' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-spotify-green text-black text-[10px] font-sans font-bold">
                    ACTIVE PERSONA
                  </span>
                )}
              </div>

              <h4 className="text-lg font-display font-bold text-white">Curator Persona</h4>
              <p className="text-xs text-white/70 font-sans leading-relaxed">
                Review submitted pitches in the interactive Studio Player, connect Spotify playlists, and grow your follower ecosystem.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  switchUserRole('curator');
                  setActiveTab('curator');
                }}
                className="h-10 px-4 rounded-xl font-bold font-display text-xs w-full mt-2 cursor-pointer bg-spotify-green hover:bg-spotify-green-hover text-black transition-colors"
              >
                Launch Curator Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: Spotify Connection */}
      {activeSubTab === 'spotify' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-surface">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-display font-bold text-white">SPOTIFY OAUTH & WEB API INTEGRATION</h3>
              <p className="text-xs text-white/60 font-sans">
                Real-time synchronization for playlists, track metadata, and follower verification.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-sans font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SPOTIFY WEB API READY
            </span>
          </div>

          <div className="bg-surface-hover p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-white/60">Connected Profile Name:</span>
              <strong className="text-white">{currentUser.name}</strong>
            </div>

            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-white/60">Spotify User Identifier:</span>
              <span className="text-white font-mono">{currentUser.spotifyId || 'Not connected'}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-white/60">Verification Status:</span>
              <span className="text-spotify-green font-bold">✓ Spotify Verified Profile</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={connectSpotifyOAuth}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold font-display flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20 transition-all"
            >
              <Radio className="w-4 h-4" /> Connect Spotify via OAuth Popup
            </button>

            <a
              href="https://open.spotify.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-sans text-spotify-green hover:underline flex items-center gap-1.5 font-bold"
            >
              Open Spotify Web Player <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* SUB TAB 4: Automated Transactional Emails Log */}
      {activeSubTab === 'emails' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-surface">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-spotify-green" />
                AUTOMATED TRANSACTIONAL EMAILS OUTBOX
              </h3>
              <p className="text-xs text-white/60 font-sans">
                Real-time delivery receipts for curator notifications, submission receipts, and placement celebrations.
              </p>
            </div>
            <span className="text-xs font-sans text-white/50">
              {emailLogs.length} Emails Logged
            </span>
          </div>

          {emailLogs.length === 0 ? (
            <div className="py-8 text-center text-xs font-sans text-white/50">
              No emails sent yet. Submit a pitch or review a track to trigger automated notifications.
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-surface-hover border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-sans font-bold uppercase">
                        {log.status}
                      </span>
                      <h4 className="text-xs font-bold text-white font-display">{log.subject}</h4>
                    </div>
                    <div className="text-[11px] font-sans text-white/60">
                      To: <span className="text-white">{log.to}</span> • Template: <span className="text-spotify-green">{log.template}</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-sans text-white/40 flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.sentAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 5: Security & Preferences */}
      {activeSubTab === 'security' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-surface">
          <div>
            <h3 className="text-base font-display font-bold text-white">PREFERENCES & NOTIFICATIONS</h3>
            <p className="text-xs text-white/60 font-sans">
              Control real-time alerts, email digests, and privacy.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-surface-hover rounded-2xl border border-white/10 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white font-sans">Real-time Placement Alerts</div>
                <div className="text-[11px] text-white/50 font-sans mt-0.5">
                  Receive immediate notification when your track is added to a Spotify playlist.
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-spotify-green" />
            </label>

            <label className="flex items-center justify-between p-4 bg-surface-hover rounded-2xl border border-white/10 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white font-sans">Curator Review Notifications</div>
                <div className="text-[11px] text-white/50 font-sans mt-0.5">
                  Get notified when a new pitch arrives in your Studio deck.
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-spotify-green" />
            </label>

            <label className="flex items-center justify-between p-4 bg-surface-hover rounded-2xl border border-white/10 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white font-sans">Weekly Placement Analytics Digest</div>
                <div className="text-[11px] text-white/50 font-sans mt-0.5">
                  Receive summary stream impact statistics via email.
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-spotify-green" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
