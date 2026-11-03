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
import { UserDashboard } from './components/dashboard/UserDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { PitchFlowModal } from './components/artist/PitchFlowModal';
import { SpotifySubmissionWizardModal } from './components/modals/SpotifySubmissionWizardModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LegalPagesModal } from './components/legal/LegalPagesModal';
import { ReportAbuseModal } from './components/modals/ReportAbuseModal';
import { BuyCreditsModal } from './components/modals/BuyCreditsModal';
import { OnboardPlaylistModal } from './components/modals/OnboardPlaylistModal';
import { GlobalAudioPlayer } from './components/player/GlobalAudioPlayer';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer } from './components/common/ToastContainer';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col justify-between pb-24">
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

        {activeTab === 'dashboard' && <UserDashboard />}

        {(activeTab === 'artist' || (activeTab as string) === 'artist_dashboard') && <ArtistDashboard />}

        {(activeTab === 'curator' || (activeTab as string) === 'curator_dashboard') && <CuratorDashboard />}

        {activeTab === 'profile' && <ProfileView />}

        {(activeTab === 'admin' || (activeTab as string) === 'admin_dashboard') && <AdminDashboard />}
      </div>

      <Footer />

      {/* Global Modals & Player & Notifications */}
      <AuthModal />
      <SpotifySubmissionWizardModal />
      <PitchFlowModal />
      <BuyCreditsModal />
      <OnboardPlaylistModal />
      <LegalPagesModal />
      <ReportAbuseModal />
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
