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
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeRole,
    switchUserRole,
    activeTab,
    setActiveTab,
    unreadNotificationCount,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setBuyCreditsModalOpen,
    openPitchModal
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const personas: { role: UserRole; label: string; desc: string }[] = [
    { role: 'artist', label: 'Artist Persona', desc: 'Pitch tracks & track live campaigns' },
    { role: 'curator', label: 'Curator Persona', desc: 'Review inbox & manage playlists' },
    { role: 'admin', label: 'Profile & Admin Hub', desc: 'Account verification & settings' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#3a3a3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo Only (No text writing next to it) */}
        <div className="flex items-center gap-8">
          <button
            id="nav-logo-btn"
            onClick={() => setActiveTab('home')}
            className="flex items-center justify-center p-1 rounded-xl hover:bg-[#2b2b2b]/60 transition-all active:scale-95 cursor-pointer"
            title="Submit Plug - Home"
            aria-label="Submit Plug Home"
          >
            <BrandLogo size={42} />
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-link-marketplace"
              onClick={() => setActiveTab('marketplace')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'marketplace' || activeTab === 'home'
                  ? 'bg-[#BE1E2F] text-white font-semibold shadow-md shadow-[#BE1E2F]/30'
                  : 'text-white/80 hover:text-white hover:bg-[#2b2b2b]'
              }`}
            >
              <Radio className="w-4 h-4" />
              Explore Playlists
            </button>

            <button
              id="nav-link-artist"
              onClick={() => {
                switchUserRole('artist');
                setActiveTab('artist');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'artist'
                  ? 'bg-[#BE1E2F] text-white font-semibold shadow-md shadow-[#BE1E2F]/30'
                  : 'text-white/80 hover:text-white hover:bg-[#2b2b2b]'
              }`}
            >
              <Music2 className="w-4 h-4" />
              Artist Hub
            </button>

            <button
              id="nav-link-curator"
              onClick={() => {
                switchUserRole('curator');
                setActiveTab('curator');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'curator'
                  ? 'bg-[#BE1E2F] text-white font-semibold shadow-md shadow-[#BE1E2F]/30'
                  : 'text-white/80 hover:text-white hover:bg-[#2b2b2b]'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              Curator Portal
            </button>

            <button
              id="nav-link-profile"
              onClick={() => {
                setActiveTab('profile');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#BE1E2F] text-white font-semibold shadow-md shadow-[#BE1E2F]/30'
                  : 'text-white/80 hover:text-white hover:bg-[#2b2b2b]'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          </nav>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          {/* Quick Pitch CTA Button (for Artist) */}
          <button
            id="nav-pitch-quick-btn"
            onClick={() => openPitchModal()}
            className="hidden sm:inline-flex btn-sane text-xs px-3.5 py-1.5 rounded-lg font-bold gap-1.5 shadow-lg shadow-[#BE1E2F]/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pitch Track
          </button>

          {/* Credit Wallet Counter */}
          <div
            id="nav-credit-wallet"
            onClick={() => setBuyCreditsModalOpen(true)}
            className="card-sane px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:border-[#BE1E2F] transition-colors group"
            title="Click to top up your Submit Plug credits"
          >
            <div className="w-6 h-6 rounded-full bg-[#BE1E2F]/20 flex items-center justify-center text-[#BE1E2F] group-hover:bg-[#BE1E2F] group-hover:text-white transition-colors">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-white/50 font-mono-code leading-none">CREDITS</div>
              <div className="text-sm font-bold text-white font-mono-code leading-tight flex items-center gap-1">
                {currentUser.creditBalance}
                <span className="text-[10px] text-[#BE1E2F] font-bold group-hover:translate-x-0.5 transition-transform">+</span>
              </div>
            </div>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              id="nav-notifications-btn"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="w-9 h-9 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] flex items-center justify-center text-white/80 hover:text-white hover:border-[#BE1E2F] transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#BE1E2F] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-plug-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 card-sane p-3 shadow-2xl border border-[#3a3a3a] z-50 rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a]">
                  <span className="text-xs font-bold font-title tracking-wider text-white">REAL-TIME ALERTS</span>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-[#BE1E2F] hover:underline font-mono-code cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#3a3a3a]/50 py-1">
                  {notifications.filter(n => n.userId === currentUser.id).length === 0 ? (
                    <div className="py-6 text-center text-white/50 text-xs font-mono-code">
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
                          className={`py-2.5 px-2 rounded-lg cursor-pointer hover:bg-[#1a1a1a] transition-colors flex items-start gap-2.5 ${
                            !notif.read ? 'bg-[#BE1E2F]/10 border-l-2 border-[#BE1E2F]' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {notif.type === 'placement_success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : notif.type === 'credits_added' ? (
                              <Coins className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-[#BE1E2F]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{notif.title}</div>
                            <div className="text-[11px] text-white/70 mt-0.5 line-clamp-2">{notif.message}</div>
                            <div className="text-[9px] text-white/40 font-mono-code mt-1">
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

          {/* Role Switcher & User Profile Pill */}
          <div className="relative">
            <button
              id="nav-role-switcher-btn"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 card-sane pl-1.5 pr-3 py-1 rounded-lg border border-[#3a3a3a] hover:border-[#BE1E2F] transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-[#BE1E2F]"
                referrerPolicy="no-referrer"
              />
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white truncate max-w-[110px] leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#BE1E2F] font-mono-code font-bold uppercase leading-tight">
                  {activeRole}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            </button>

            {/* Role Dropdown */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 card-sane p-2 shadow-2xl border border-[#3a3a3a] z-50 rounded-xl">
                <div className="px-2 py-1.5 text-[11px] font-mono-code text-white/50 uppercase border-b border-[#3a3a3a] mb-1">
                  Switch Persona & Role
                </div>
                {personas.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchUserRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      activeRole === r.role ? 'bg-[#BE1E2F] text-white font-bold' : 'hover:bg-[#1a1a1a] text-white/80'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-title">{r.label}</div>
                      <div className={`text-[10px] ${activeRole === r.role ? 'text-white/80' : 'text-white/50'}`}>
                        {r.desc}
                      </div>
                    </div>
                    {activeRole === r.role && <span className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setRoleDropdownOpen(false);
                  }}
                  className="w-full mt-2 pt-2 border-t border-[#3a3a3a] p-2 text-left text-xs font-mono-code text-white/80 hover:text-white flex items-center justify-between hover:bg-[#1a1a1a] rounded-lg"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#BE1E2F]" /> Manage Profile & Settings
                  </span>
                  <span className="text-[10px] text-emerald-400">● Connected</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar (No SQL/Firebase) */}
      <div className="lg:hidden flex items-center justify-around border-t border-[#3a3a3a] bg-[#1a1a1a] px-2 py-2 text-xs">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded ${
            activeTab === 'marketplace' || activeTab === 'home' ? 'text-[#BE1E2F] font-bold' : 'text-white/70'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Explore</span>
        </button>
        <button
          onClick={() => {
            switchUserRole('artist');
            setActiveTab('artist');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded ${
            activeTab === 'artist' ? 'text-[#BE1E2F] font-bold' : 'text-white/70'
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span>Artist Hub</span>
        </button>
        <button
          onClick={() => {
            switchUserRole('curator');
            setActiveTab('curator');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded ${
            activeTab === 'curator' ? 'text-[#BE1E2F] font-bold' : 'text-white/70'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Curator Portal</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded ${
            activeTab === 'profile' ? 'text-[#BE1E2F] font-bold' : 'text-white/70'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>
    </header>
  );
};
