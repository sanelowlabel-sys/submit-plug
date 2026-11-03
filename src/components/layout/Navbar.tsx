import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import {
  Radio,
  Music2,
  ListMusic,
  User,
  Coins,
  Bell,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Plus,
  LogIn,
  LogOut,
  LayoutDashboard,
  Link2,
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    openLoginModal,
    openRegisterModal,
    logout,
    activeRole,
    switchUserRole,
    activeTab,
    setActiveTab,
    unreadNotificationCount,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setBuyCreditsModalOpen,
    openPitchModal,
    openSpotifyWizard,
    setOnboardPlaylistModalOpen
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const personas: { role: UserRole; label: string; desc: string }[] = [
    { role: 'artist', label: 'Artist Persona', desc: 'Pitch tracks & track live campaigns' },
    { role: 'curator', label: 'Curator Persona', desc: 'Review inbox & manage playlists' },
    { role: 'admin', label: 'Profile & Admin Hub', desc: 'Account verification & settings' }
  ];

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-2 sm:pt-3 pb-2 transition-all">
      {/* Floating Island Dock Navigation */}
      <div className="max-w-7xl mx-auto rounded-2xl bg-[#121212]/90 backdrop-blur-xl border border-white/10 shadow-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            id="nav-logo-btn"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition-all active:scale-95 cursor-pointer group"
            title="Playlist Plug - Home"
            aria-label="Playlist Plug Home"
          >
            <BrandLogo size={36} />
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-display font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                Playlist Plug
                <span className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-pulse" />
              </span>
              <span className="text-[9px] uppercase tracking-widest text-spotify-green font-semibold">
                Spotify Pitching
              </span>
            </div>
          </button>

          {/* Segmented Island Pill Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/5 gap-1">
            <button
              id="nav-link-home"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </button>

            <button
              id="nav-link-explore"
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Explore
            </button>

            {currentUser && (
              <>
                <button
                  id="nav-link-artist-hub"
                  onClick={() => {
                    switchUserRole('artist');
                    setActiveTab('artist');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'artist'
                      ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5" />
                  Artists Hub
                </button>

                <button
                  id="nav-link-curator-hub"
                  onClick={() => {
                    switchUserRole('curator');
                    setActiveTab('curator');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'curator'
                      ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  Curator Hub
                </button>

                <button
                  id="nav-link-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    activeTab === 'dashboard'
                      ? 'bg-spotify-green text-black shadow-md shadow-spotify-green/20'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    id="nav-link-admin"
                    onClick={() => setActiveTab('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'admin'
                        ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                        : 'text-amber-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Right CTA Actions & User Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Pitch / Spotify Link Submission Wizard */}
          <button
            id="nav-spotify-wizard-btn"
            onClick={() => {
              if (!currentUser) {
                openLoginModal();
              } else {
                openSpotifyWizard ? openSpotifyWizard() : openPitchModal();
              }
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-display font-bold text-black bg-gradient-to-r from-spotify-green to-emerald-400 hover:brightness-110 shadow-lg shadow-spotify-green/25 hover:shadow-spotify-green/40 transition-all cursor-pointer active:scale-95"
            title="Submit Spotify Track, Album, or Playlist"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Submit Spotify Link</span>
            <span className="xs:hidden">Submit</span>
          </button>

          {!currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="nav-login-btn"
                onClick={() => openLoginModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-display font-bold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-spotify-green" />
                <span>LOG IN</span>
              </button>
              <button
                id="nav-register-btn"
                onClick={() => openRegisterModal()}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold text-black bg-spotify-green hover:bg-spotify-green-hover shadow-md shadow-spotify-green/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>SIGN UP</span>
              </button>
            </div>
          ) : (
            <>
              {/* Wallet Pill */}
              <button
                id="nav-credit-wallet"
                onClick={() => setBuyCreditsModalOpen(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-spotify-green/50 px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all group"
                title="Wallet: Click to top up credits"
              >
                <div className="w-5 h-5 rounded-full bg-spotify-green/20 flex items-center justify-center text-spotify-green group-hover:bg-spotify-green group-hover:text-black transition-colors">
                  <Coins className="w-3 h-3" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[9px] text-white/50 leading-none">WALLET</div>
                  <div className="text-xs font-bold text-white leading-tight flex items-center gap-0.5">
                    {currentUser.creditBalance} CR
                    <span className="text-[10px] text-spotify-green font-bold">+</span>
                  </div>
                </div>
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  id="nav-notifications-btn"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:border-spotify-green/50 transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-spotify-green text-black text-[9px] font-bold rounded-full flex items-center justify-center animate-plug-pulse">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel p-3 shadow-2xl border border-white/10 z-50 rounded-2xl">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold font-display tracking-wider text-white">REAL-TIME ALERTS</span>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-[11px] text-spotify-green hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-white/5 py-1">
                      {notifications.filter(n => n.userId === currentUser.id).length === 0 ? (
                        <div className="py-6 text-center text-white/50 text-xs font-sans">
                          No notifications yet
                        </div>
                      ) : (
                        notifications
                          .filter(n => n.userId === currentUser.id)
                          .map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationAsRead(notif.id);
                                if (notif.actionUrl === 'artist') {
                                  switchUserRole('artist');
                                  setActiveTab('artist');
                                } else if (notif.actionUrl === 'curator') {
                                  switchUserRole('curator');
                                  setActiveTab('curator');
                                }
                                setNotifDropdownOpen(false);
                              }}
                              className={`py-2 px-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors flex items-start gap-2.5 ${
                                !notif.read ? 'bg-spotify-green/10 border-l-2 border-spotify-green' : ''
                              }`}
                            >
                              <div className="mt-0.5">
                                {notif.type === 'placement_success' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : notif.type === 'credits_added' ? (
                                  <Coins className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <Sparkles className="w-4 h-4 text-spotify-green" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{notif.title}</div>
                                <div className="text-[11px] text-white/70 mt-0.5 line-clamp-2">{notif.message}</div>
                                <div className="text-[9px] text-white/40 mt-1">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Persona & Role Switcher */}
              <div className="relative">
                <button
                  id="nav-role-switcher-btn"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-white/5 pl-1 pr-2 sm:pr-2.5 py-1 rounded-xl border border-white/10 hover:border-spotify-green/50 transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-spotify-green"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-white truncate max-w-[100px] leading-tight font-sans">
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] text-spotify-green font-display font-bold uppercase leading-tight">
                      {activeRole}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-white/60" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel p-2 shadow-2xl border border-white/10 z-50 rounded-2xl">
                    <div className="px-2 py-1.5 text-[11px] text-white/50 uppercase border-b border-white/10 mb-1">
                      Switch Persona & Role
                    </div>
                    {personas.map(r => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchUserRole(r.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          activeRole === r.role ? 'bg-spotify-green text-black font-bold' : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-display">{r.label}</div>
                          <div className={`text-[10px] ${activeRole === r.role ? 'text-black/80' : 'text-white/50'}`}>
                            {r.desc}
                          </div>
                        </div>
                        {activeRole === r.role && <span className="w-2 h-2 rounded-full bg-black" />}
                      </button>
                    ))}

                    <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full p-2 text-left text-xs text-white/80 hover:text-white flex items-center justify-between hover:bg-white/5 rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-spotify-green" /> Manage Profile
                        </span>
                        <span className="text-[10px] text-spotify-green font-semibold">● Connected</span>
                      </button>

                      <button
                        id="nav-logout-btn"
                        onClick={() => {
                          logout();
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full p-2 text-left text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Direct Logout Button */}
              <button
                id="nav-direct-logout-btn"
                onClick={() => logout()}
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Dock */}
      <div className="lg:hidden flex items-center overflow-x-auto scrollbar-none mt-2 px-2 py-1.5 rounded-xl bg-[#121212]/80 backdrop-blur-md border border-white/5 text-xs gap-1.5 justify-start">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg whitespace-nowrap cursor-pointer ${
            activeTab === 'home' ? 'bg-spotify-green text-black font-bold' : 'text-white/70 hover:text-white'
          }`}
        >
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg whitespace-nowrap cursor-pointer ${
            activeTab === 'marketplace' ? 'bg-spotify-green text-black font-bold' : 'text-white/70 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Explore</span>
        </button>
        {currentUser && (
          <>
            <button
              onClick={() => {
                switchUserRole('artist');
                setActiveTab('artist');
              }}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-lg whitespace-nowrap cursor-pointer ${
                activeTab === 'artist' ? 'bg-spotify-green text-black font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Artists</span>
            </button>
            <button
              onClick={() => {
                switchUserRole('curator');
                setActiveTab('curator');
              }}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-lg whitespace-nowrap cursor-pointer ${
                activeTab === 'curator' ? 'bg-spotify-green text-black font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Curators</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-lg whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-spotify-green text-black font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-lg whitespace-nowrap cursor-pointer ${
                activeTab === 'profile' ? 'bg-spotify-green text-black font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1 py-1 px-2.5 rounded-lg whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin' ? 'bg-amber-400 text-black font-bold' : 'text-amber-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
