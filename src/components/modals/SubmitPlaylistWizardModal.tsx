import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  X,
  ListMusic,
  Plus,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Music2,
  UserPlus,
  Heart,
  ArrowRight,
  ArrowLeft,
  Coins,
  Clock,
  ExternalLink,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
  LogIn
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchSpotifyMetadata } from '../../utils/spotifyParser';

interface SubmitPlaylistWizardModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const SubmitPlaylistWizardModal: React.FC<SubmitPlaylistWizardModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    onboardPlaylistModalOpen,
    setOnboardPlaylistModalOpen,
    addPlaylist,
    currentUser,
    setActiveTab,
    openLoginModal,
    openRegisterModal
  } = useApp();

  const showModal = isOpen !== undefined ? isOpen : onboardPlaylistModalOpen;
  const handleClose = () => {
    if (onClose) onClose();
    else setOnboardPlaylistModalOpen(false);
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Spotify Playlist Meta
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverArt, setCoverArt] = useState(
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'
  );
  const [followerCount, setFollowerCount] = useState<number>(24500);
  const [trackCount, setTrackCount] = useState<number>(65);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([
    'Melodic Techno',
    'Deep House'
  ]);
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Step 2: Submission Pricing Mode & Credits (Free vs Premium Choice)
  const [acceptFreeSubmissions, setAcceptFreeSubmissions] = useState<boolean>(true);
  const [acceptPremiumSubmissions, setAcceptPremiumSubmissions] = useState<boolean>(true);
  const [creditAmount, setCreditAmount] = useState<number>(2); // 1, 2, 3, 5, 10
  const [responseHours, setResponseHours] = useState<number>(48);
  const [curatorReviewGuidelines, setCuratorReviewGuidelines] = useState(
    'We seek pristine mixing, evocative melody lines, and club-ready organic arrangements.'
  );

  // Step 3: Curator Spotify Gates
  const [requireCuratorFollow, setRequireCuratorFollow] = useState(true);
  const [requirePlaylistFollow, setRequirePlaylistFollow] = useState(true);
  const [requireSongSave, setRequireSongSave] = useState(false);
  const [targetSongUrl, setTargetSongUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showModal) return null;

  const popularGenreOptions = [
    'Deep House',
    'Melodic Techno',
    'Techno',
    'Synthwave',
    'Lo-Fi Chill',
    'Indie Rock',
    'Bedroom Pop',
    'Afrobeats',
    'Hip-Hop',
    'EDM / Mainstage',
    'Ambient / Downtempo',
    'Drum & Bass'
  ];

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleAddCustomGenre = () => {
    if (!customGenreInput.trim()) return;
    if (!selectedGenres.includes(customGenreInput.trim())) {
      setSelectedGenres([...selectedGenres, customGenreInput.trim()]);
    }
    setCustomGenreInput('');
  };

  const handleUrlChange = async (val: string) => {
    setSpotifyUrl(val);
    if (
      val.includes('spotify.com/playlist/') ||
      val.startsWith('spotify:playlist:') ||
      val.includes('open.spotify.com')
    ) {
      setIsLookingUp(true);
      try {
        const meta = await fetchSpotifyMetadata(val);
        if (meta) {
          if (meta.title) setTitle(meta.title);
          if (meta.coverArt) setCoverArt(meta.coverArt);
        } else {
          const res = await fetch('/api/playlists/spotify-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: val })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.title) setTitle(data.title);
            if (data.thumbnailUrl) setCoverArt(data.thumbnailUrl);
          }
        }
      } catch (err) {
        console.warn('Spotify lookup failed:', err);
      } finally {
        setIsLookingUp(false);
      }
    }
  };

  const handleLaunchLive = async () => {
    if (!title) return;
    setIsSubmitting(true);

    try {
      await addPlaylist({
        title,
        description: description || '',
        coverArt,
        spotifyUrl,
        spotifyUri: `spotify:playlist:${Date.now()}`,
        followerCount: Number(followerCount) || 0,
        trackCount: Number(trackCount) || 0,
        genres: selectedGenres.length > 0 ? selectedGenres : ['Indie', 'Alternative'],
        pitchCostCredits: acceptPremiumSubmissions ? creditAmount : 1,
        freePitchEnabled: acceptFreeSubmissions,
        isFeatured: false,
        acceptingSubmissions: true
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // fallback
      }

      handleClose();
      // Redirect to explore marketplace to view live playlist immediately
      setActiveTab('marketplace');
    } catch (err) {
      console.error('Failed to submit playlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden my-6 bg-surface">
        {/* Wizard Header Bar with Brand Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-surface-hover/50">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} withBadge={false} alt="Brand Logo" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-bold text-white tracking-wide">
                  SUBMIT PLAYLIST WIZARD
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-spotify-green/20 text-spotify-green border border-spotify-green/30">
                  REAL-TIME LIVE SYNC
                </span>
              </div>
              <div className="text-xs font-sans text-white/50">
                Configure your intake model, credit pricing, and Spotify growth gates
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unauthenticated Curator Gate */}
        {!currentUser ? (
          <div className="p-8 text-center space-y-5">
            <div className="flex justify-center">
              <BrandLogo size={60} alt="Brand Logo" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-display font-bold text-white tracking-wide">
                AUTHENTICATION REQUIRED TO ONBOARD PLAYLISTS
              </h4>
              <p className="text-xs text-white/60 font-sans max-w-md mx-auto">
                Please sign in or create a verified curator account to connect your Spotify playlists and receive real-time track pitches.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleClose();
                  openLoginModal();
                }}
                className="w-full sm:w-auto h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/25 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                SIGN IN NOW
              </button>
              <button
                onClick={() => {
                  handleClose();
                  openRegisterModal();
                }}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl font-bold text-xs bg-white text-black hover:scale-105 transition-transform cursor-pointer"
              >
                CREATE CURATOR ACCOUNT
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Wizard Step Progress Indicator */}
        <div className="px-6 py-3 bg-surface border-b border-white/10 grid grid-cols-4 gap-2">
          {[
            { step: 1, label: '1. Playlist Info' },
            { step: 2, label: '2. Pricing & Credits' },
            { step: 3, label: '3. Verification & SLA' },
            { step: 4, label: '4. Preview & Launch' }
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => {
                if (item.step < currentStep || (item.step === 2 && title)) {
                  setCurrentStep(item.step as 1 | 2 | 3 | 4);
                }
              }}
              className={`text-center py-2 px-1 rounded-xl text-[11px] font-sans font-bold transition-all cursor-pointer ${
                currentStep === item.step
                  ? 'bg-spotify-green text-black shadow-sm font-extrabold'
                  : currentStep > item.step
                  ? 'bg-surface-hover text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Step Contents */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
          {/* STEP 1: SPOTIFY DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <Radio className="w-5 h-5 text-spotify-green flex-shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-white/70 leading-relaxed">
                  Enter your Spotify Playlist URL or URI. We’ll automatically extract your cover art
                  and title, and calculate your real-time listener reach.
                </div>
              </div>

              <div>
                <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                  Spotify Playlist Link or URI: <span className="text-spotify-green">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={spotifyUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM"
                    className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-sans text-white placeholder-white/30 focus:border-spotify-green focus:outline-none"
                  />
                  {isLookingUp && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-spotify-green font-sans animate-pulse font-medium">
                      Fetching Spotify...
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                    Playlist Title: <span className="text-spotify-green">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midnight Waves & Lo-Fi Lounge"
                    className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                    Cover Art Image URL:
                  </label>
                  <input
                    type="text"
                    value={coverArt}
                    onChange={(e) => setCoverArt(e.target.value)}
                    className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                  Playlist Curatorial Description:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your sonic vision, BPM range, or mood (e.g. Late night melodic driving grooves for club and road trips)..."
                  className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                    Followers Count:
                  </label>
                  <input
                    type="number"
                    value={followerCount}
                    onChange={(e) => setFollowerCount(Number(e.target.value))}
                    className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                    Current Track Count:
                  </label>
                  <input
                    type="number"
                    value={trackCount}
                    onChange={(e) => setTrackCount(Number(e.target.value))}
                    className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                  />
                </div>
              </div>

              {/* Genre Selector */}
              <div>
                <label className="text-xs font-sans text-white/80 block mb-1.5 font-semibold">
                  Select Associated Genres:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {popularGenreOptions.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-spotify-green text-black border-spotify-green font-bold shadow-sm'
                            : 'glass-panel text-white/60 border-white/10 hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {genre}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={customGenreInput}
                    onChange={(e) => setCustomGenreInput(e.target.value)}
                    placeholder="Add custom genre tag..."
                    className="flex-1 bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGenre}
                    className="px-4 py-2 bg-surface-hover text-white text-xs font-sans rounded-xl border border-white/10 hover:bg-surface-hover/80 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PRICING MODE & SUBMISSION CREDITS */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <Coins className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-white/70 leading-relaxed">
                  <strong className="text-white">Submission Economics & Intake Model:</strong> Curators can
                  choose when they need free or premium submissions and how many credits per pitch!
                </div>
              </div>

              {/* Free vs Premium Toggle Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Free Submission Choice */}
                <div
                  onClick={() => setAcceptFreeSubmissions(!acceptFreeSubmissions)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    acceptFreeSubmissions
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'glass-panel opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-sans font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      FREE SUBMISSION
                    </span>
                    <input
                      type="checkbox"
                      checked={acceptFreeSubmissions}
                      onChange={(e) => setAcceptFreeSubmissions(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                  </div>
                  <p className="text-xs font-sans text-white/60 leading-relaxed">
                    Allow artists to submit using their weekly free allowance. Requires completing your
                    Spotify follow gates.
                  </p>
                  <div className="mt-3 text-[10px] font-sans text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-1 rounded-full inline-block">
                    {acceptFreeSubmissions ? 'ACTIVE & ACCEPTING' : 'DISABLED'}
                  </div>
                </div>

                {/* Premium Submission Choice */}
                <div
                  onClick={() => setAcceptPremiumSubmissions(!acceptPremiumSubmissions)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    acceptPremiumSubmissions
                      ? 'bg-spotify-green/10 border-spotify-green/40 shadow-lg shadow-spotify-green/10'
                      : 'glass-panel opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-sans font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-spotify-green" />
                      PREMIUM DIRECT PITCH
                    </span>
                    <input
                      type="checkbox"
                      checked={acceptPremiumSubmissions}
                      onChange={(e) => setAcceptPremiumSubmissions(e.target.checked)}
                      className="w-4 h-4 accent-spotify-green"
                    />
                  </div>
                  <p className="text-xs font-sans text-white/60 leading-relaxed">
                    Direct high-priority inbox intake with guaranteed listening time & actionable feedback.
                  </p>
                  <div className="mt-3 text-[10px] font-sans text-spotify-green font-bold bg-spotify-green/15 px-2.5 py-1 rounded-full inline-block">
                    {acceptPremiumSubmissions ? 'PAID PRIORITY ENABLED' : 'DISABLED'}
                  </div>
                </div>
              </div>

              {/* Credit Price Setting (If Premium enabled) */}
              {acceptPremiumSubmissions && (
                <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-sans font-bold text-white block">
                        Credit Price per Pitch:
                      </label>
                      <div className="text-[11px] font-sans text-white/50">
                        How many credits artists must spend to pitch this playlist
                      </div>
                    </div>
                    <div className="text-xs font-sans font-bold text-spotify-green bg-spotify-green/10 px-3 py-1 rounded-full border border-spotify-green/20">
                      {creditAmount} Credits (~${(creditAmount * 2.5).toFixed(2)} value)
                    </div>
                  </div>

                  {/* Preset Credit Selector */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[1, 2, 3, 5, 10].map((credits) => (
                      <button
                        key={credits}
                        type="button"
                        onClick={() => setCreditAmount(credits)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-sans font-bold transition-all cursor-pointer border ${
                          creditAmount === credits
                            ? 'bg-spotify-green text-black border-spotify-green shadow-md font-extrabold'
                            : 'bg-surface-hover text-white/70 border-white/10 hover:text-white'
                        }`}
                      >
                        {credits} {credits === 1 ? 'Credit' : 'Credits'}
                        <div className="text-[9px] opacity-75 font-normal">
                          ${(credits * 2.5).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Time & Review Commitment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                    Guaranteed Response Window:
                  </label>
                  <select
                    value={responseHours}
                    onChange={(e) => setResponseHours(Number(e.target.value))}
                    className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                  >
                    <option value={24} className="bg-surface text-white">24 Hours (Fast-Track Curator)</option>
                    <option value={48} className="bg-surface text-white">48 Hours (Standard)</option>
                    <option value={72} className="bg-surface text-white">72 Hours (3 Days)</option>
                    <option value={120} className="bg-surface text-white">5 Days</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                    Acceptance Strategy:
                  </label>
                  <div className="text-xs font-sans text-white/80 p-2.5 bg-surface-hover/50 border border-white/10 rounded-xl">
                    {acceptFreeSubmissions && acceptPremiumSubmissions
                      ? 'Hybrid (Free + Premium Intake)'
                      : acceptFreeSubmissions
                      ? 'Free Discovery Only'
                      : acceptPremiumSubmissions
                      ? 'Premium Fast-Track Only'
                      : 'Closed for Pitches'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-sans text-white/80 block mb-1 font-semibold">
                  Curator Note to Artists (What sound do you accept?):
                </label>
                <textarea
                  rows={2}
                  value={curatorReviewGuidelines}
                  onChange={(e) => setCuratorReviewGuidelines(e.target.value)}
                  placeholder="e.g. Please submit finished tracks with strong percussion and vocal hooks. No demos or unmixed files."
                  className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-sans text-white focus:border-spotify-green focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: CURATOR VERIFICATION & COMPLIANCE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-spotify-green flex-shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-white/70 leading-relaxed">
                  <strong className="text-white">Spotify Description Ownership Verification:</strong> To protect artists and maintain trust, our platform uses one-time description codes to verify curator ownership without requiring Spotify OAuth login.
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-display">
                    <span className="w-5 h-5 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center text-[10px]">
                      1
                    </span>
                    AUTOMATIC VERIFICATION CODE GENERATION
                  </div>
                  <p className="text-xs text-white/60 font-sans leading-relaxed">
                    Upon launching this playlist, you will receive a unique one-time verification token (e.g. <span className="font-mono text-spotify-green font-bold">PLUG-VERIFY-XXXXXX</span>).
                  </p>
                </div>

                <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-display">
                    <span className="w-5 h-5 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center text-[10px]">
                      2
                    </span>
                    PASTE INTO SPOTIFY PLAYLIST DESCRIPTION
                  </div>
                  <p className="text-xs text-white/60 font-sans leading-relaxed">
                    Simply paste the code into your playlist’s description on Spotify. Click "Check Spotify Description" in your Curator Hub to verify immediately.
                  </p>
                </div>

                <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-display">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    MANUAL ADMIN REVIEW FALLBACK
                  </div>
                  <p className="text-xs text-white/60 font-sans leading-relaxed">
                    If your playlist is managed through third-party distributors or API restrictions prevent live description parsing, you can request an instant manual review from our admin moderation team.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs font-sans text-white/60 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-spotify-green flex-shrink-0" />
                  <span>100% Anti-Payola Compliant • No Spotify account login or follower gating required.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW & LAUNCH LIVE */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-emerald-300 leading-relaxed">
                  <strong className="text-white">Ready for Real-Time Launch:</strong> This playlist will
                  immediately go live on Explore and the Homepage, allowing artists to pitch in real time.
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="glass-panel p-5 rounded-3xl border border-white/10 bg-surface shadow-xl">
                <div className="flex items-start gap-4">
                  <img
                    src={coverArt}
                    alt={title}
                    className="w-24 h-24 rounded-2xl object-cover border border-white/10 shadow-md flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-sans font-bold">
                        VERIFIED CURATOR
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green text-[10px] font-sans font-bold">
                        LIVE NOW
                      </span>
                    </div>

                    <h4 className="text-lg font-display font-bold text-white truncate mt-1">
                      {title || 'Untitled Playlist'}
                    </h4>
                    <div className="text-xs font-sans text-white/60">
                      Curated by {currentUser.name}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-surface-hover/50 rounded-xl border border-white/5 text-[10px] font-sans">
                      <div>
                        <div className="text-white/40">FOLLOWERS</div>
                        <div className="font-bold text-white font-sans">
                          {Number(followerCount).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40">INTAKE MODE</div>
                        <div className="font-bold text-emerald-400 font-sans">
                          {acceptFreeSubmissions ? 'Free Accepted' : 'Paid Only'}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40">PITCH FEE</div>
                        <div className="font-bold text-spotify-green font-sans">
                          {acceptPremiumSubmissions ? `${creditAmount} Credits` : 'Free Only'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-1">
                  {selectedGenres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-sans text-white/70 border border-white/10"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-surface-hover/30 rounded-2xl border border-white/5 text-xs font-sans text-white/60 space-y-1">
                <div>• Connected Spotify URL: {spotifyUrl || 'Standard Spotify Link'}</div>
                <div>• Response Guarantee: ~{responseHours} Hours</div>
                <div>• Active Gates: Curator Follow ({requireCuratorFollow ? 'Yes' : 'No'}), Playlist Follow ({requirePlaylistFollow ? 'Yes' : 'No'}), Track Save ({requireSongSave ? 'Yes' : 'No'})</div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        <div className="px-6 py-4 border-t border-white/10 bg-surface-hover/40 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 rounded-xl bg-surface-hover border border-white/10 text-xs font-sans text-white/80 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-surface border border-white/10 text-xs font-sans text-white/60 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={currentStep === 1 && !title}
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                className="h-11 px-5 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-spotify-green/25 disabled:opacity-50 transition-colors"
              >
                Continue to Step {currentStep + 1} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !title}
                onClick={handleLaunchLive}
                className="h-11 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/30 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Launching Live...' : 'Launch Playlist Live in Real-Time'}
              </button>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
