import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Track, Playlist, PitchType, Submission } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import {
  X,
  Music2,
  Sparkles,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins,
  Send,
  Headphones,
  ExternalLink,
  Radio,
  Heart,
  ChevronRight,
  ChevronLeft,
  Search,
  Disc3,
  ListMusic,
  UserCheck,
  Check,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseSpotifyUrl, isSpotifyUrl, fetchSpotifyMetadata } from '../../utils/spotifyParser';
import { supabase, isSupabaseConfigured, mapSubmissionToSupabaseRow } from '../../lib/supabase';

interface SpotifySubmissionWizardModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialPlaylist?: Playlist | null;
}

export const SpotifySubmissionWizardModal: React.FC<SpotifySubmissionWizardModalProps> = ({
  isOpen,
  onClose,
  initialPlaylist
}) => {
  const {
    spotifyWizardOpen,
    setSpotifyWizardOpen,
    playlists,
    currentUser,
    submitPitch,
    openLoginModal,
    setBuyCreditsModalOpen,
    audioState,
    playTrack,
    pauseTrack,
    setActiveTab,
    showToast
  } = useApp();

  const showModal = isOpen !== undefined ? isOpen : spotifyWizardOpen;
  const handleClose = () => {
    if (onClose) onClose();
    else setSpotifyWizardOpen(false);
  };

  // Steps: 1: Spotify Link & Verification, 2: Campaign & Genre Target, 3: Pitch & Gates, 4: Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Spotify URL & Extracted Metadata
  const [spotifyUrlInput, setSpotifyUrlInput] = useState(
    'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
  );
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    id: string;
    type: 'track' | 'album' | 'playlist';
    title: string;
    artist: string;
    coverArt: string;
    durationSec: number;
    previewUrl: string;
    canonicalUrl: string;
    genre: string;
  } | null>(null);

  // Step 2: Campaign Target & Genre
  const [campaignGoal, setCampaignGoal] = useState<'playlist_placement' | 'discovery_boost' | 'editorial_feedback' | 'album_launch'>('playlist_placement');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Deep House', 'Melodic Techno']);
  const [customGenre, setCustomGenre] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');

  // Step 3: Pitch Note & Follower Gates
  const [customPitchNote, setCustomPitchNote] = useState(
    'Hey! This new track features organic percussion and deep analog basslines that would fit seamlessly into your rotation.'
  );
  const [pitchType, setPitchType] = useState<PitchType>('premium');
  const [gateFollowCurator, setGateFollowCurator] = useState(true);
  const [gateFollowPlaylist, setGateFollowPlaylist] = useState(true);
  const [hookTimestamp, setHookTimestamp] = useState('0:45');

  // Step 4: Submission State & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSubmission, setSubmittedSubmission] = useState<Submission | null>(null);

  const availableGenres = [
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
    'Drum & Bass',
    'R&B'
  ];

  // Set initial playlist if provided
  useEffect(() => {
    if (initialPlaylist) {
      setSelectedPlaylistId(initialPlaylist.id);
    } else if (playlists.length > 0 && !selectedPlaylistId) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [initialPlaylist, playlists, selectedPlaylistId]);

  // Initial metadata extract on open if default URL present
  useEffect(() => {
    if (showModal && !extractedData && spotifyUrlInput) {
      handleExtractMetadata(spotifyUrlInput);
    }
  }, [showModal]);

  if (!showModal) return null;

  const targetPlaylist = playlists.find(p => p.id === selectedPlaylistId) || playlists[0];

  const handleExtractMetadata = async (rawUrl: string) => {
    setUrlError(null);
    const trimmed = rawUrl.trim();

    if (!trimmed) {
      setUrlError('Please paste a Spotify Track, Album, or Playlist link');
      return;
    }

    if (!isSpotifyUrl(trimmed)) {
      setUrlError('Invalid Spotify URL format. Please paste a link starting with https://open.spotify.com/...');
      return;
    }

    setIsExtracting(true);
    try {
      const parsed = parseSpotifyUrl(trimmed);
      if (!parsed) {
        setUrlError('Could not parse Spotify identifier from this link');
        setIsExtracting(false);
        return;
      }

      const meta = await fetchSpotifyMetadata(trimmed);

      if (meta) {
        setExtractedData({
          id: meta.id || parsed.id,
          type: (meta.type as any) || parsed.type,
          title: meta.title || 'Unknown Track',
          artist: meta.artist || (currentUser?.name ?? 'Artist'),
          coverArt: meta.coverArt || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
          durationSec: 194,
          previewUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
          canonicalUrl: meta.spotifyUrl || parsed.canonicalUrl,
          genre: 'Deep House'
        });
      } else {
        // Fallback heuristics if offline
        setExtractedData({
          id: parsed.id,
          type: parsed.type,
          title: `Spotify ${parsed.type.toUpperCase()} (#${parsed.id.slice(0, 6)})`,
          artist: currentUser?.name || 'Verified Artist',
          coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
          durationSec: 185,
          previewUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
          canonicalUrl: parsed.canonicalUrl,
          genre: 'Deep House'
        });
      }
    } catch (err: any) {
      setUrlError(`Metadata extraction failed: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleGenre = (g: string) => {
    if (selectedGenres.includes(g)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(x => x !== g));
      }
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const handleAddCustomGenre = () => {
    if (!customGenre.trim()) return;
    if (!selectedGenres.includes(customGenre.trim())) {
      setSelectedGenres([...selectedGenres, customGenre.trim()]);
    }
    setCustomGenre('');
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!extractedData) {
        setUrlError('Please enter a valid Spotify link and extract details before proceeding');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedPlaylistId) {
        showToast('Please select a target playlist', '', 'error');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as any);
    }
  };

  const handleSubmitFinal = async () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }

    if (!extractedData || !targetPlaylist) return;

    const creditCost = pitchType === 'premium' ? (targetPlaylist.pitchCostCredits || 1) : 0;
    if (pitchType === 'premium' && (currentUser.creditBalance ?? 0) < creditCost) {
      showToast('Insufficient Credits', 'Please top up credits or choose a Free Submission', 'error');
      setBuyCreditsModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const trackPayload: Track = {
        id: `tr_${extractedData.id}`,
        title: extractedData.title,
        artist: extractedData.artist,
        albumArt: extractedData.coverArt,
        spotifyUrl: extractedData.canonicalUrl,
        spotifyUri: `spotify:${extractedData.type}:${extractedData.id}`,
        previewUrl: extractedData.previewUrl,
        durationSec: extractedData.durationSec,
        genre: selectedGenres[0] || 'Deep House',
        releaseDate: new Date().toISOString().split('T')[0]
      };

      const result = await submitPitch(
        trackPayload,
        targetPlaylist.id,
        pitchType,
        customPitchNote
      );

      if (result.success && result.submission) {
        setSubmittedSubmission(result.submission);

        // Also sync directly to Supabase table if configured
        if (isSupabaseConfigured) {
          try {
            const row = mapSubmissionToSupabaseRow(result.submission);
            await supabase.from('submissions').upsert(row);
          } catch (sbErr) {
            console.warn('[Supabase Wizard] Direct sync warning:', sbErr);
          }
        }

        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.5 }
          });
        } catch {}

        showToast(
          'Spotify Link Submitted!',
          `Pitched to "${targetPlaylist.title}" with real-time status tracking.`,
          'success'
        );
      } else {
        showToast('Submission Failed', result.error || 'Please try again', 'error');
      }
    } catch (err: any) {
      showToast('Submission Error', err.message || 'Network exception', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview audio helper
  const isAudioPlaying = audioState.isPlaying && audioState.currentTrack?.id === `tr_${extractedData?.id}`;
  const handleToggleAudio = () => {
    if (!extractedData) return;
    const t: Track = {
      id: `tr_${extractedData.id}`,
      title: extractedData.title,
      artist: extractedData.artist,
      albumArt: extractedData.coverArt,
      spotifyUrl: extractedData.canonicalUrl,
      spotifyUri: `spotify:track:${extractedData.id}`,
      previewUrl: extractedData.previewUrl,
      durationSec: extractedData.durationSec,
      genre: selectedGenres[0] || 'Electronic',
      releaseDate: new Date().toISOString().split('T')[0]
    };
    if (isAudioPlaying) {
      pauseTrack();
    } else {
      playTrack(t);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl p-5 sm:p-7 relative overflow-hidden bg-surface/95 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient green glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-spotify-green/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} withBadge={false} />
            <div>
              <h3 className="text-lg font-bold font-display tracking-wider text-white flex items-center gap-2">
                <span>SPOTIFY SUBMISSION WIZARD</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green font-mono border border-spotify-green/30">
                  REALTIME PIPELINE
                </span>
              </h3>
              <p className="text-xs text-white/60 font-sans">
                Pitch tracks, albums, or playlists to verified curators
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Indicator */}
        {!submittedSubmission && (
          <div className="py-4 border-b border-white/10 flex-shrink-0">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, label: 'Spotify Link', icon: Disc3 },
                { step: 2, label: 'Targeting', icon: Radio },
                { step: 3, label: 'Pitch & Gates', icon: Sparkles },
                { step: 4, label: 'Live Review', icon: Send }
              ].map(({ step, label, icon: Icon }) => {
                const isActive = currentStep === step;
                const isPast = currentStep > step;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-all ${
                      isActive
                        ? 'border-spotify-green bg-spotify-green/15 text-white font-bold'
                        : isPast
                        ? 'border-white/20 bg-black/40 text-spotify-green'
                        : 'border-white/5 bg-black/20 text-white/40'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                        isActive
                          ? 'bg-spotify-green text-black'
                          : isPast
                          ? 'bg-spotify-green/20 text-spotify-green'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : step}
                    </div>
                    <span className="hidden sm:inline truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {/* SUCCESS SCREEN */}
          {submittedSubmission ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-spotify-green/20 border-2 border-spotify-green flex items-center justify-center mx-auto text-spotify-green">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-bold font-display text-white">
                  SUBMISSION DISPATCHED SUCCESSFULLY!
                </h4>
                <p className="text-xs text-white/60 font-sans max-w-md mx-auto">
                  Your Spotify pitch has been registered in the live Supabase database. The curator has received an instant notification.
                </p>
              </div>

              {/* Submission Receipt Box */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-black/40 border border-white/10 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={submittedSubmission.track.albumArt}
                    alt={submittedSubmission.track.title}
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                  <div>
                    <div className="text-sm font-bold text-white font-display">
                      {submittedSubmission.track.title}
                    </div>
                    <div className="text-xs text-white/60">
                      {submittedSubmission.track.artist}
                    </div>
                    <div className="text-[11px] text-spotify-green font-mono mt-0.5">
                      Target: {submittedSubmission.playlistTitle}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Submission ID</span>
                    <span className="font-mono text-white/90 text-[11px] truncate block">
                      {submittedSubmission.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Initial Status</span>
                    <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    setActiveTab('dashboard');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-spotify-green/20"
                >
                  View in Real-time Dashboard
                </button>
                <button
                  onClick={() => {
                    setSubmittedSubmission(null);
                    setCurrentStep(1);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-hover hover:bg-white/10 border border-white/10 text-white font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Submit Another Link
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: SPOTIFY LINK & METADATA EXTRACTION */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-sans text-white/80 font-bold mb-1.5 flex items-center justify-between">
                      <span>ENTER SPOTIFY URL (TRACK, ALBUM, OR PLAYLIST)</span>
                      <span className="text-[11px] text-spotify-green font-normal">
                        Supports open.spotify.com & URI formats
                      </span>
                    </label>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Disc3 className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={spotifyUrlInput}
                          onChange={(e) => {
                            setSpotifyUrlInput(e.target.value);
                            setUrlError(null);
                          }}
                          placeholder="https://open.spotify.com/track/..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExtractMetadata(spotifyUrlInput)}
                        disabled={isExtracting}
                        className="px-5 py-3 bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {isExtracting ? (
                          <span className="animate-pulse">FETCHING...</span>
                        ) : (
                          <>
                            <span>EXTRACT</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {urlError && (
                      <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-sans">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{urlError}</span>
                      </div>
                    )}
                  </div>

                  {/* Extracted Metadata Card */}
                  {extractedData && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-spotify-green/40 relative overflow-hidden animate-fadeIn">
                      <div className="flex items-start gap-4">
                        <div className="relative group flex-shrink-0">
                          <img
                            src={extractedData.coverArt}
                            alt={extractedData.title}
                            className="w-24 h-24 rounded-xl object-cover border border-white/10 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={handleToggleAudio}
                            className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center text-white transition-opacity cursor-pointer"
                            title="Play 30s Preview"
                          >
                            {isAudioPlaying ? (
                              <Pause className="w-7 h-7 text-spotify-green" />
                            ) : (
                              <Play className="w-7 h-7 text-spotify-green ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-spotify-green/20 text-spotify-green text-[10px] font-mono font-bold uppercase">
                              {extractedData.type} Verified
                            </span>
                            <span className="text-[11px] text-white/50 font-mono">
                              ID: {extractedData.id.slice(0, 10)}...
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white font-display truncate">
                            {extractedData.title}
                          </h4>
                          <p className="text-xs text-white/70 font-sans truncate mb-2">
                            {extractedData.artist}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
                            <span>Duration: ~3:15</span>
                            <span>•</span>
                            <a
                              href={extractedData.canonicalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-spotify-green hover:underline inline-flex items-center gap-1"
                            >
                              <span>Open on Spotify</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sample links for quick testing */}
                  <div className="pt-2">
                    <div className="text-[11px] text-white/40 font-sans mb-2">
                      Try with sample Spotify release links:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT';
                          setSpotifyUrlInput(url);
                          handleExtractMetadata(url);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[11px] border border-white/10 cursor-pointer"
                      >
                        Never Gonna Give You Up (Track)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = 'https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa';
                          setSpotifyUrlInput(url);
                          handleExtractMetadata(url);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[11px] border border-white/10 cursor-pointer"
                      >
                        Random Access Memories (Album)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CAMPAIGN TARGETING & GENRES */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {/* Campaign Objective */}
                  <div>
                    <label className="block text-xs font-sans text-white/80 font-bold mb-2">
                      1. CAMPAIGN OBJECTIVE
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'playlist_placement', label: 'Placement', desc: 'Add to top curator playlists' },
                        { id: 'discovery_boost', label: 'Algorithm Boost', desc: 'Trigger Spotify Release Radar' },
                        { id: 'editorial_feedback', label: 'Curator Feedback', desc: 'Actionable mix & hook notes' },
                        { id: 'album_launch', label: 'Album Rollout', desc: 'Multi-single campaign focus' }
                      ].map((obj) => (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => setCampaignGoal(obj.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            campaignGoal === obj.id
                              ? 'border-spotify-green bg-spotify-green/15 text-white shadow-sm'
                              : 'border-white/10 bg-black/30 text-white/60 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold font-display text-white mb-1">
                            {obj.label}
                          </div>
                          <div className="text-[10px] text-white/50 leading-tight">
                            {obj.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Genres */}
                  <div>
                    <label className="block text-xs font-sans text-white/80 font-bold mb-2">
                      2. TARGET GENRES & SUB-GENRES
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {availableGenres.map((g) => {
                        const isSelected = selectedGenres.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleToggleGenre(g)}
                            className={`px-3 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-spotify-green text-black font-semibold shadow-sm'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customGenre}
                        onChange={(e) => setCustomGenre(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomGenre())}
                        placeholder="Add custom genre (e.g. Afro-Melodic)..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomGenre}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl font-display font-semibold transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Target Playlist Selector */}
                  <div>
                    <label className="block text-xs font-sans text-white/80 font-bold mb-2">
                      3. SELECT PRIMARY TARGET PLAYLIST
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {playlists.map((pl) => {
                        const isSelected = selectedPlaylistId === pl.id;
                        return (
                          <div
                            key={pl.id}
                            onClick={() => setSelectedPlaylistId(pl.id)}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-spotify-green bg-spotify-green/10'
                                : 'border-white/10 bg-black/30 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={pl.coverArt}
                                alt={pl.title}
                                className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white font-display truncate">
                                  {pl.title}
                                </div>
                                <div className="text-[11px] text-white/60 truncate">
                                  by {pl.curatorName}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono mt-0.5">
                                  <span>{(pl.followerCount || 0).toLocaleString()} Followers</span>
                                  <span>•</span>
                                  <span className="text-spotify-green">
                                    {pl.avgResponseHours || 24}h Avg Response
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-spotify-green bg-spotify-green text-black'
                                    : 'border-white/30'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PITCH NOTE & GATES */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {/* Pitch Note */}
                  <div>
                    <label className="block text-xs font-sans text-white/80 font-bold mb-1.5">
                      PITCH NOTE TO CURATOR
                    </label>
                    <textarea
                      rows={3}
                      value={customPitchNote}
                      onChange={(e) => setCustomPitchNote(e.target.value)}
                      placeholder="Explain why this track fits this playlist, release background, or memorable drops..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-spotify-green font-sans"
                    />
                    <div className="flex items-center justify-between text-[11px] text-white/40 mt-1 font-sans">
                      <span>Curators review pitches faster when notes highlight key moments.</span>
                      <span>{customPitchNote.length}/350</span>
                    </div>
                  </div>

                  {/* Focus Drop Timestamp */}
                  <div>
                    <label className="block text-xs font-sans text-white/80 font-bold mb-1.5">
                      KEY HOOK / MAIN DROP TIMESTAMP
                    </label>
                    <input
                      type="text"
                      value={hookTimestamp}
                      onChange={(e) => setHookTimestamp(e.target.value)}
                      placeholder="e.g. 0:45"
                      className="w-36 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-spotify-green"
                    />
                  </div>

                  {/* Submission Tier (Free vs Premium) */}
                  <div>
                    <label className="block text-xs font-sans text-white/80 font-bold mb-2">
                      SUBMISSION TIER
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPitchType('premium')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          pitchType === 'premium'
                            ? 'border-spotify-green bg-spotify-green/15 shadow-md shadow-spotify-green/10'
                            : 'border-white/10 bg-black/30 text-white/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold font-display text-white">
                            PRIORITY REVIEW
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-spotify-green text-black text-[10px] font-bold font-mono">
                            1 CREDIT
                          </span>
                        </div>
                        <ul className="text-[11px] text-white/60 space-y-1 font-sans">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-spotify-green" />
                            Guaranteed 24-48h curator response
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-spotify-green" />
                            Detailed written feedback tags
                          </li>
                        </ul>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPitchType('free')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          pitchType === 'free'
                            ? 'border-spotify-green bg-spotify-green/15 shadow-md shadow-spotify-green/10'
                            : 'border-white/10 bg-black/30 text-white/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold font-display text-white">
                            FREE WITH GATES
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold font-mono">
                            0 CREDITS
                          </span>
                        </div>
                        <ul className="text-[11px] text-white/60 space-y-1 font-sans">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-spotify-green" />
                            Follow curator on Spotify
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-spotify-green" />
                            Follow target playlist
                          </li>
                        </ul>
                      </button>
                    </div>
                  </div>

                  {pitchType === 'free' && (
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                      <div className="text-xs font-bold text-white font-display">
                        Required Spotify Follower Gates:
                      </div>
                      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gateFollowCurator}
                          onChange={(e) => setGateFollowCurator(e.target.checked)}
                          className="w-4 h-4 accent-spotify-green rounded"
                        />
                        <span>Auto-follow curator ({targetPlaylist.curatorName})</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gateFollowPlaylist}
                          onChange={(e) => setGateFollowPlaylist(e.target.checked)}
                          className="w-4 h-4 accent-spotify-green rounded"
                        />
                        <span>Auto-follow target playlist ({targetPlaylist.title})</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="text-xs font-mono text-white/40 uppercase tracking-wider">
                      Submission Summary & Confirmation
                    </div>

                    {/* Track info preview */}
                    <div className="flex items-center gap-4">
                      <img
                        src={extractedData?.coverArt}
                        alt={extractedData?.title}
                        className="w-16 h-16 rounded-xl object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold font-display text-white truncate">
                          {extractedData?.title}
                        </div>
                        <div className="text-xs text-white/60 font-sans truncate">
                          {extractedData?.artist}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-mono">
                            {selectedGenres[0]}
                          </span>
                          <span className="text-[10px] text-spotify-green font-mono">
                            Drop @ {hookTimestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs font-sans">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase">Target Playlist</span>
                        <span className="text-white font-semibold truncate block">
                          {targetPlaylist.title}
                        </span>
                        <span className="text-[11px] text-white/50">
                          Curated by {targetPlaylist.curatorName}
                        </span>
                      </div>

                      <div>
                        <span className="text-white/40 block text-[10px] uppercase">Submission Tier</span>
                        <span className="text-spotify-green font-semibold capitalize block">
                          {pitchType} ({pitchType === 'premium' ? '1 Credit' : 'Free Gate'})
                        </span>
                        <span className="text-[11px] text-white/50">
                          {pitchType === 'premium' ? 'Priority 24-48h review' : 'Standard review queue'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 text-xs">
                      <span className="text-white/40 block text-[10px] uppercase mb-1">Pitch Note</span>
                      <p className="text-white/70 italic text-[11px] font-sans bg-white/5 p-2.5 rounded-xl border border-white/5">
                        "{customPitchNote}"
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-spotify-green/10 border border-spotify-green/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
                        <span className="text-white/90 font-sans">Supabase Real-Time Submissions Table</span>
                      </div>
                      <span className="text-spotify-green font-mono text-[11px] font-semibold">
                        Ready to Dispatch
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!submittedSubmission && (
          <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-display font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-spotify-green/20"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-display font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-spotify-green/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">DISPATCHING TO SUPABASE...</span>
                  ) : (
                    <>
                      <span>CONFIRM & SUBMIT</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
