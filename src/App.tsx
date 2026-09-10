/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/landing/HeroSection';
import { HowItWorks } from './components/landing/HowItWorks';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { ArtistDashboard } from './components/artist/ArtistDashboard';
import { CuratorDashboard } from './components/curator/CuratorDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { PitchFlowModal } from './components/artist/PitchFlowModal';
import { BuyCreditsModal } from './components/modals/BuyCreditsModal';
import { OnboardPlaylistModal } from './components/modals/OnboardPlaylistModal';
import { GlobalAudioPlayer } from './components/player/GlobalAudioPlayer';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer } from './components/common/ToastContainer';

const MainContent: React.FC = () => {
  const { activeTab, activeRole } = useApp();

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white flex flex-col justify-between pb-24">
      <Navbar />

      <div className="flex-1">
        {activeTab === 'home' && (
          <div className="space-y-12">
            <HeroSection />
            <MarketplaceView />
            <HowItWorks />
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="space-y-8">
            <MarketplaceView />
          </div>
        )}

        {activeTab === 'dashboard' && (
          activeRole === 'curator' ? <CuratorDashboard /> : <ArtistDashboard />
        )}

        {(activeTab === 'artist' || (activeTab as string) === 'artist_dashboard') && <ArtistDashboard />}

        {(activeTab === 'curator' || (activeTab as string) === 'curator_dashboard') && <CuratorDashboard />}

        {(activeTab === 'profile' || (activeTab as string) === 'admin' || (activeTab as string) === 'admin_dashboard') && <ProfileView />}
      </div>

      <Footer />

      {/* Global Modals & Player & Notifications */}
      <AuthModal />
      <PitchFlowModal />
      <BuyCreditsModal />
      <OnboardPlaylistModal />
      <GlobalAudioPlayer />
      <ToastContainer />
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
