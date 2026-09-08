import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
    setActiveTab
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
    if (val.includes('spotify.com/playlist/') || val.startsWith('spotify:playlist:')) {
      setIsLookingUp(true);
      try {
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
        description:
          description ||
          'High quality independent playlist curated for discerning Spotify listeners.',
        coverArt,
        spotifyUrl: spotifyUrl || 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM',
        spotifyUri: `spotify:playlist:${Date.now()}`,
        followerCount: Number(followerCount) || 12500,
        trackCount: Number(trackCount) || 50,
        genres: selectedGenres.length > 0 ? selectedGenres : ['Electronic', 'Indie'],
        pitchCostCredits: acceptPremiumSubmissions ? creditAmount : 0,
        freePitchEnabled: acceptFreeSubmissions,
        isFeatured: true,
        acceptingSubmissions: true,
        gates: {
          requireCuratorFollow,
          requirePlaylistFollow,
          requireSongSave,
          curatorSpotifyProfileUrl:
            currentUser.spotifyUri ||
            `https://open.spotify.com/user/${currentUser.spotifyId || 'curator'}`,
          targetSongSpotifyUrl: targetSongUrl
        }
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
      <div className="card-sane w-full max-w-2xl rounded-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden my-6 bg-[#161616]">
        {/* Wizard Header Bar */}
        <div className="px-6 py-5 border-b border-[#2e2e2e] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#BE1E2F] flex items-center justify-center text-white shadow-md shadow-[#BE1E2F]/25">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-title font-bold text-white tracking-wide">
                  SUBMIT PLAYLIST WIZARD
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#BE1E2F]/20 text-[#BE1E2F] border border-[#BE1E2F]/30">
                  REAL-TIME LIVE SYNC
                </span>
              </div>
              <div className="text-xs font-mono-code text-white/50">
                Configure your intake model, credit pricing, and Spotify growth gates
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Step Progress Indicator */}
        <div className="px-6 py-3 bg-[#181818] border-b border-[#2a2a2a] grid grid-cols-4 gap-2">
          {[
            { step: 1, label: '1. Playlist Info' },
            { step: 2, label: '2. Submission & Credits' },
            { step: 3, label: '3. Follower Gates' },
            { step: 4, label: '4. Preview & Launch' }
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => {
                if (item.step < currentStep || (item.step === 2 && title)) {
                  setCurrentStep(item.step as 1 | 2 | 3 | 4);
                }
              }}
              className={`text-center py-1.5 px-1 rounded-lg text-[11px] font-mono-code font-bold transition-all cursor-pointer ${
                currentStep === item.step
                  ? 'bg-[#BE1E2F] text-white shadow-sm'
                  : currentStep > item.step
                  ? 'bg-[#282828] text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#202020] text-white/40'
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
              <div className="p-3.5 rounded-xl bg-[#202020] border border-[#333] flex items-start gap-3">
                <Radio className="w-5 h-5 text-[#BE1E2F] flex-shrink-0 mt-0.5" />
                <div className="text-xs font-mono-code text-white/70 leading-relaxed">
                  Enter your Spotify Playlist URL or URI. We’ll automatically extract your cover art
                  and title, and calculate your real-time listener reach.
                </div>
              </div>

              <div>
                <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                  Spotify Playlist Link or URI: <span className="text-[#BE1E2F]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={spotifyUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM"
                    className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-4 py-2.5 text-xs font-mono-code text-white placeholder-white/30 focus:border-[#BE1E2F] focus:outline-none"
                  />
                  {isLookingUp && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#BE1E2F] font-mono-code animate-pulse">
                      Fetching Spotify...
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                    Playlist Title: <span className="text-[#BE1E2F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sane Low Sessions Club"
                    className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3.5 py-2 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                    Cover Art Image URL:
                  </label>
                  <input
                    type="text"
                    value={coverArt}
                    onChange={(e) => setCoverArt(e.target.value)}
                    className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3.5 py-2 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                  Playlist Curatorial Description:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your sonic vision, BPM range, or mood (e.g. Late night melodic driving grooves for club and road trips)..."
                  className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3.5 py-2 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                    Followers Count:
                  </label>
                  <input
                    type="number"
                    value={followerCount}
                    onChange={(e) => setFollowerCount(Number(e.target.value))}
                    className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3.5 py-2 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                    Current Track Count:
                  </label>
                  <input
                    type="number"
                    value={trackCount}
                    onChange={(e) => setTrackCount(Number(e.target.value))}
                    className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3.5 py-2 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Genre Selector */}
              <div>
                <label className="text-xs font-mono-code text-white/80 block mb-1.5 font-semibold">
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
                        className={`px-3 py-1 rounded-lg text-xs font-mono-code transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#BE1E2F] text-white border-[#BE1E2F] font-bold shadow-sm'
                            : 'bg-[#1f1f1f] text-white/60 border-[#333] hover:text-white'
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
                    className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGenre}
                    className="px-3 py-1.5 bg-[#2b2b2b] text-white text-xs font-mono-code rounded-lg border border-[#3a3a3a] hover:bg-[#333] cursor-pointer"
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
              <div className="p-3.5 rounded-xl bg-[#202020] border border-[#333] flex items-start gap-3">
                <Coins className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-mono-code text-white/70 leading-relaxed">
                  <strong className="text-white">Submission Economics & Intake Model:</strong> Curators can
                  choose when they need free or premium submissions and how many credits per pitch!
                </div>
              </div>

              {/* Free vs Premium Toggle Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Free Submission Choice */}
                <div
                  onClick={() => setAcceptFreeSubmissions(!acceptFreeSubmissions)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    acceptFreeSubmissions
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-[#181818] border-[#333] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono-code font-bold text-emerald-400 flex items-center gap-1.5">
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
                  <p className="text-[11px] font-mono-code text-white/60 leading-relaxed">
                    Allow artists to submit using their weekly free allowance. Requires completing your
                    Spotify follow gates.
                  </p>
                  <div className="mt-3 text-[10px] font-mono-code text-emerald-400 font-bold bg-emerald-500/15 px-2 py-1 rounded inline-block">
                    {acceptFreeSubmissions ? 'ACTIVE & ACCEPTING' : 'DISABLED'}
                  </div>
                </div>

                {/* Premium Submission Choice */}
                <div
                  onClick={() => setAcceptPremiumSubmissions(!acceptPremiumSubmissions)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    acceptPremiumSubmissions
                      ? 'bg-[#BE1E2F]/10 border-[#BE1E2F]/40'
                      : 'bg-[#181818] border-[#333] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono-code font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#BE1E2F]" />
                      PREMIUM DIRECT PITCH
                    </span>
                    <input
                      type="checkbox"
                      checked={acceptPremiumSubmissions}
                      onChange={(e) => setAcceptPremiumSubmissions(e.target.checked)}
                      className="w-4 h-4 accent-[#BE1E2F]"
                    />
                  </div>
                  <p className="text-[11px] font-mono-code text-white/60 leading-relaxed">
                    Direct high-priority inbox intake with guaranteed listening time & actionable feedback.
                  </p>
                  <div className="mt-3 text-[10px] font-mono-code text-[#BE1E2F] font-bold bg-[#BE1E2F]/15 px-2 py-1 rounded inline-block">
                    {acceptPremiumSubmissions ? 'PAID PRIORITY ENABLED' : 'DISABLED'}
                  </div>
                </div>
              </div>

              {/* Credit Price Setting (If Premium enabled) */}
              {acceptPremiumSubmissions && (
                <div className="p-4 rounded-xl bg-[#1d1d1d] border border-[#333] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-mono-code font-bold text-white block">
                        Credit Price per Pitch:
                      </label>
                      <div className="text-[11px] font-mono-code text-white/50">
                        How many credits artists must spend to pitch this playlist
                      </div>
                    </div>
                    <div className="text-sm font-title font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20">
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
                        className={`py-2 px-1 text-center rounded-lg text-xs font-mono-code font-bold transition-all cursor-pointer border ${
                          creditAmount === credits
                            ? 'bg-amber-400 text-black border-amber-400 shadow-md font-extrabold'
                            : 'bg-[#141414] text-white/70 border-[#333] hover:text-white'
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
                  <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                    Guaranteed Response Window:
                  </label>
                  <select
                    value={responseHours}
                    onChange={(e) => setResponseHours(Number(e.target.value))}
                    className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3.5 py-2.5 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                  >
                    <option value={24}>24 Hours (Fast-Track Curator)</option>
                    <option value={48}>48 Hours (Standard)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                    <option value={120}>5 Days</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                    Acceptance Strategy:
                  </label>
                  <div className="text-xs font-mono-code text-white/80 p-2.5 bg-[#111] border border-[#333] rounded-xl">
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
                <label className="text-xs font-mono-code text-white/80 block mb-1 font-semibold">
                  Curator Note to Artists (What sound do you accept?):
                </label>
                <textarea
                  rows={2}
                  value={curatorReviewGuidelines}
                  onChange={(e) => setCuratorReviewGuidelines(e.target.value)}
                  placeholder="e.g. Please submit finished tracks with strong percussion and vocal hooks. No demos or unmixed files."
                  className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3.5 py-2 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: CURATOR GATES */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#202020] border border-[#333] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-mono-code text-white/70 leading-relaxed">
                  <strong className="text-white">Spotify Follower & Growth Gates:</strong> Mandatory organic actions
                  artists must execute before their submission is placed into your inbox.
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#1a1a1a] border border-[#333] cursor-pointer hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-4 h-4 text-[#1DB954]" />
                    <div>
                      <div className="text-xs font-mono-code font-bold text-white">
                        Require Artist to Follow Curator Spotify Profile
                      </div>
                      <div className="text-[11px] font-mono-code text-white/50">
                        Grows your personal artist / curator follower count on Spotify
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireCuratorFollow}
                    onChange={(e) => setRequireCuratorFollow(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#1a1a1a] border border-[#333] cursor-pointer hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-[#1DB954]" />
                    <div>
                      <div className="text-xs font-mono-code font-bold text-white">
                        Require Artist to Save & Follow this Playlist
                      </div>
                      <div className="text-[11px] font-mono-code text-white/50">
                        Expands your playlist’s Spotify organic algorithm reach
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requirePlaylistFollow}
                    onChange={(e) => setRequirePlaylistFollow(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

                <div className="p-3.5 rounded-xl bg-[#1a1a1a] border border-[#333] space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-[#BE1E2F]" />
                      <div>
                        <div className="text-xs font-mono-code font-bold text-white">
                          Require Artist to Like / Save a Specific Track
                        </div>
                        <div className="text-[11px] font-mono-code text-white/50">
                          Great for promoting your label’s flagship release or latest single
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireSongSave}
                      onChange={(e) => setRequireSongSave(e.target.checked)}
                      className="w-4 h-4 accent-[#BE1E2F]"
                    />
                  </label>

                  {requireSongSave && (
                    <div className="pt-2 border-t border-[#2e2e2e]">
                      <label className="text-[11px] font-mono-code text-white/70 block mb-1">
                        Spotify Track Link to Like / Save:
                      </label>
                      <input
                        type="text"
                        value={targetSongUrl}
                        onChange={(e) => setTargetSongUrl(e.target.value)}
                        placeholder="https://open.spotify.com/track/..."
                        className="w-full bg-[#111] border border-[#3a3a3a] rounded-xl px-3 py-2 text-xs font-mono-code text-white focus:border-[#BE1E2F] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW & LAUNCH LIVE */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-mono-code text-emerald-300 leading-relaxed">
                  <strong className="text-white">Ready for Real-Time Launch:</strong> This playlist will
                  immediately go live on Explore and the Homepage, allowing artists to pitch in real time.
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="card-sane p-5 rounded-2xl border border-[#BE1E2F]/40 bg-[#1a1a1a] shadow-xl">
                <div className="flex items-start gap-4">
                  <img
                    src={coverArt}
                    alt={title}
                    className="w-24 h-24 rounded-xl object-cover border border-[#3a3a3a] shadow-md flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono-code font-bold">
                        VERIFIED CURATOR
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#BE1E2F]/20 text-[#BE1E2F] text-[10px] font-mono-code font-bold">
                        LIVE NOW
                      </span>
                    </div>

                    <h4 className="text-lg font-title font-bold text-white truncate mt-1">
                      {title || 'Untitled Playlist'}
                    </h4>
                    <div className="text-xs font-mono-code text-white/60">
                      Curated by {currentUser.name}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-[#121212] rounded-lg border border-[#2a2a2a] text-[10px] font-mono-code">
                      <div>
                        <div className="text-white/40">FOLLOWERS</div>
                        <div className="font-bold text-white font-mono-code">
                          {Number(followerCount).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40">INTAKE MODE</div>
                        <div className="font-bold text-emerald-400 font-mono-code">
                          {acceptFreeSubmissions ? 'Free Accepted' : 'Paid Only'}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40">PITCH FEE</div>
                        <div className="font-bold text-amber-300 font-mono-code">
                          {acceptPremiumSubmissions ? `${creditAmount} Credits` : 'Free Only'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2e2e2e] flex flex-wrap gap-1">
                  {selectedGenres.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded bg-[#222] text-[10px] font-mono-code text-white/70 border border-[#333]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#181818] rounded-xl border border-[#333] text-xs font-mono-code text-white/60 space-y-1">
                <div>• Connected Spotify URL: {spotifyUrl || 'Standard Spotify Link'}</div>
                <div>• Response Guarantee: ~{responseHours} Hours</div>
                <div>• Active Gates: Curator Follow ({requireCuratorFollow ? 'Yes' : 'No'}), Playlist Follow ({requirePlaylistFollow ? 'Yes' : 'No'}), Track Save ({requireSongSave ? 'Yes' : 'No'})</div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        <div className="px-6 py-4 border-t border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 rounded-xl bg-[#2b2b2b] border border-[#3a3a3a] text-xs font-mono-code text-white/80 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-[#222] border border-[#3a3a3a] text-xs font-mono-code text-white/60 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={currentStep === 1 && !title}
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                className="btn-sane text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#BE1E2F]/25 disabled:opacity-50"
              >
                Continue to Step {currentStep + 1} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !title}
                onClick={handleLaunchLive}
                className="btn-sane text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#BE1E2F]/30 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Launching Live...' : 'Launch Playlist Live in Real-Time'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
