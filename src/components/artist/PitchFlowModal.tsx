import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Track, Playlist, PitchType } from '../../types';
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
  Zap,
  ExternalLink,
  UserPlus,
  Radio,
  Heart,
  LogIn,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { globalAudioEngine } from '../../utils/audioEngine';
import { fetchSpotifyMetadata, convertSpotifyMetadataToTrack } from '../../utils/spotifyParser';

export const PitchFlowModal: React.FC = () => {
  const {
    pitchModalOpen,
    closePitchModal,
    selectedPlaylistForPitch,
    playlists,
    artistTracks,
    addArtistTrack,
    submitPitch,
    currentUser,
    freeWeeklyCredits,
    setBuyCreditsModalOpen,
    playTrack,
    pauseTrack,
    audioState,
    verifyGateAction,
    openLoginModal,
    openRegisterModal
  } = useApp();

  const [step, setStep] = useState<'select_track' | 'configure_pitch' | 'success'>('select_track');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(artistTracks[0] || null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    selectedPlaylistForPitch?.id || (playlists[0]?.id || '')
  );

  const [pitchType, setPitchType] = useState<PitchType>('premium');
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Spotlight listen state
  const [spotlightListening, setSpotlightListening] = useState(false);
  const [spotlightElapsedSec, setSpotlightElapsedSec] = useState(0);
  const SPOTLIGHT_REQUIRED_SEC = 30;

  // Curator Follower Gates interactive state
  const [gateFollowedCurator, setGateFollowedCurator] = useState(false);
  const [gateFollowedPlaylist, setGateFollowedPlaylist] = useState(false);
  const [gateSavedSong, setGateSavedSong] = useState(false);

  // Custom Spotify URL input for new track
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showAddCustomTrack, setShowAddCustomTrack] = useState(false);
  const [isImportingTrack, setIsImportingTrack] = useState(false);

  useEffect(() => {
    if (selectedPlaylistForPitch) {
      setSelectedPlaylistId(selectedPlaylistForPitch.id);
      if (!selectedPlaylistForPitch.freePitchEnabled) {
        setPitchType('premium');
      }
    }
  }, [selectedPlaylistForPitch]);

  useEffect(() => {
    if (artistTracks.length > 0 && !selectedTrack) {
      setSelectedTrack(artistTracks[0]);
    }
  }, [artistTracks, selectedTrack]);

  const targetPlaylist = playlists.find(p => p.id === selectedPlaylistId) || playlists[0] || {
    id: 'pl_default',
    title: 'Top Hits Discovery',
    curatorId: 'curator_1',
    curatorName: 'Curator',
    followerCount: 25000,
    pitchCostCredits: 1,
    freePitchEnabled: true,
    avgResponseHours: 24,
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    gates: {
      requireCuratorFollow: true,
      requirePlaylistFollow: true,
      requireSongSave: false
    }
  };

  // Sync spotlight listening progress with global footer audio player
  useEffect(() => {
    if (!pitchModalOpen) return;
    if (
      targetPlaylist.spotlightTrack &&
      audioState.currentTrack?.id === targetPlaylist.spotlightTrack.id &&
      audioState.isPlaying
    ) {
      setSpotlightListening(true);
      const current = Math.min(SPOTLIGHT_REQUIRED_SEC, Math.floor(audioState.currentTime));
      setSpotlightElapsedSec(current);
      if (audioState.currentTime >= SPOTLIGHT_REQUIRED_SEC) {
        setGateSavedSong(true);
      }
    } else if (audioState.currentTrack?.id === targetPlaylist.spotlightTrack?.id && !audioState.isPlaying) {
      setSpotlightListening(false);
    }
  }, [audioState.currentTrack?.id, audioState.isPlaying, audioState.currentTime, targetPlaylist.spotlightTrack, pitchModalOpen]);

  if (!pitchModalOpen) return null;

  const cost = pitchType === 'premium' ? (targetPlaylist.pitchCostCredits || 1) : 0;
  const hasEnoughCredits = (currentUser?.creditBalance ?? 0) >= cost;
  const isFreeSpotlightComplete = spotlightElapsedSec >= SPOTLIGHT_REQUIRED_SEC;

  // Gate check for free pitches
  const needsCuratorFollow = targetPlaylist.gates?.requireCuratorFollow ?? true;
  const needsPlaylistFollow = targetPlaylist.gates?.requirePlaylistFollow ?? true;
  const needsSongSave = targetPlaylist.gates?.requireSongSave ?? false;

  const areAllGatesCompleted =
    (!needsCuratorFollow || gateFollowedCurator) &&
    (!needsPlaylistFollow || gateFollowedPlaylist) &&
    (!needsSongSave || gateSavedSong);

  // Spotlight Listen Engine (routes through Global Footer Player)
  const startSpotlightListen = () => {
    if (!targetPlaylist.spotlightTrack) return;
    setSpotlightListening(true);
    playTrack(targetPlaylist.spotlightTrack, `Spotlight: ${targetPlaylist.title}`);
  };

  const pauseSpotlightListen = () => {
    pauseTrack();
    setSpotlightListening(false);
  };

  const handlePerformGate = async (actionType: 'curator_follow' | 'playlist_follow' | 'song_save', url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    await verifyGateAction(targetPlaylist.id, actionType);

    if (actionType === 'curator_follow') setGateFollowedCurator(true);
    if (actionType === 'playlist_follow') setGateFollowedPlaylist(true);
    if (actionType === 'song_save') setGateSavedSong(true);
  };

  const handleAddTrackFromSpotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    setIsImportingTrack(true);
    setStatusMessage(null);

    try {
      const meta = await fetchSpotifyMetadata(customUrlInput.trim());
      let newTrack: Track;
      if (meta) {
        newTrack = convertSpotifyMetadataToTrack(meta);
        if (targetPlaylist.genres?.[0]) {
          newTrack.genre = targetPlaylist.genres[0];
        }
      } else {
        const idMatch = customUrlInput.match(/track\/([a-zA-Z0-9]+)/);
        const spotifyId = idMatch ? idMatch[1] : `trk_${Date.now()}`;
        newTrack = {
          id: `trk_${Date.now()}`,
          title: 'Imported Spotify Track',
          artist: currentUser?.name || 'Verified Artist',
          albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
          spotifyUrl: customUrlInput.startsWith('http') ? customUrlInput : `https://open.spotify.com/track/${spotifyId}`,
          spotifyUri: `spotify:track:${spotifyId}`,
          previewUrl: '',
          durationSec: 210,
          genre: targetPlaylist.genres?.[0] || 'Electronic',
          bpm: 125,
          key: 'D Minor',
          releaseDate: new Date().toISOString().split('T')[0]
        };
      }

      addArtistTrack(newTrack);
      setSelectedTrack(newTrack);
      playTrack(newTrack, `Imported: ${newTrack.title}`);
      setShowAddCustomTrack(false);
      setCustomUrlInput('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to parse Spotify track.' });
    } finally {
      setIsImportingTrack(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      setStatusMessage({ type: 'error', text: 'Please select a track to pitch.' });
      return;
    }

    if (!targetPlaylist) {
      setStatusMessage({ type: 'error', text: 'Please select a target playlist.' });
      return;
    }

    if (pitchType === 'free') {
      if (freeWeeklyCredits < 1) {
        setStatusMessage({
          type: 'error',
          text: 'No free weekly submissions remaining. Top up credits for premium guaranteed pitch.'
        });
        return;
      }
      if (!areAllGatesCompleted) {
        setStatusMessage({
          type: 'error',
          text: 'Please complete all curator follower gate requirements below before submitting.'
        });
        return;
      }
    }

    if (pitchType === 'premium' && !hasEnoughCredits) {
      setBuyCreditsModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await submitPitch({
      track: selectedTrack,
      playlistId: targetPlaylist.id,
      pitchType,
      customMessage: customMessage.trim() || undefined,
      spotlightDuration: pitchType === 'free' ? spotlightElapsedSec : undefined,
      gateActionsCompleted: {
        followedCurator: gateFollowedCurator,
        followedPlaylist: gateFollowedPlaylist,
        savedSong: gateSavedSong
      }
    });

    setIsSubmitting(false);

    if (res.success) {
      setStep('success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1DB954', '#ffffff', '#1ed760']
      });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden my-8 bg-surface">
        {/* Header with Brand Logo */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-surface-hover/50">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} withBadge={false} alt="Brand Logo" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-bold text-white tracking-wide">SUBMIT TRACK PITCH</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-spotify-green/20 text-spotify-green border border-spotify-green/30">
                  REAL-TIME
                </span>
              </div>
              <div className="text-xs font-sans text-white/50">
                Direct Submission to Spotify Curators
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              pauseSpotlightListen();
              closePitchModal();
            }}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        {!currentUser ? (
          <div className="p-8 text-center space-y-5">
            <div className="flex justify-center">
              <BrandLogo size={60} alt="Brand Logo" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-display font-bold text-white tracking-wide">
                AUTHENTICATION REQUIRED TO PITCH
              </h4>
              <p className="text-xs text-white/60 font-sans max-w-md mx-auto">
                Please sign in to submit your track to <span className="text-white font-bold">{targetPlaylist.title}</span> and track curator reviews in real-time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  closePitchModal();
                  openLoginModal();
                }}
                className="w-full sm:w-auto h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/25 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                SIGN IN NOW
              </button>
              <button
                onClick={() => {
                  closePitchModal();
                  openRegisterModal();
                }}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl font-bold text-xs bg-white text-black hover:scale-105 transition-transform cursor-pointer"
              >
                CREATE ARTIST ACCOUNT
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
          {step === 'select_track' && (
            <div className="space-y-5">
              {/* Target Playlist Banner */}
              <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={targetPlaylist.coverArt}
                    alt={targetPlaylist.title}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-[10px] font-sans text-spotify-green font-bold uppercase tracking-wider">TARGET PLAYLIST</div>
                    <div className="text-sm font-bold text-white font-display truncate max-w-[240px] sm:max-w-xs">
                      {targetPlaylist.title}
                    </div>
                    <div className="text-xs text-white/60 font-sans">
                      by {targetPlaylist.curatorName} • {targetPlaylist.followerCount.toLocaleString()} followers
                    </div>
                  </div>
                </div>

                <select
                  value={selectedPlaylistId}
                  onChange={e => setSelectedPlaylistId(e.target.value)}
                  className="bg-surface text-white text-xs font-sans py-2 px-3 rounded-xl border border-white/10 focus:outline-none focus:border-spotify-green max-w-[140px]"
                >
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 1: Select Track */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-display tracking-wider text-white flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-spotify-green" />
                    SELECT SPOTIFY RELEASE TO PITCH
                  </label>
                  <button
                    onClick={() => setShowAddCustomTrack(!showAddCustomTrack)}
                    className="text-xs font-sans text-spotify-green hover:underline cursor-pointer font-medium"
                  >
                    {showAddCustomTrack ? 'Pick from catalog' : '+ Paste Spotify URL'}
                  </button>
                </div>

                {showAddCustomTrack ? (
                  <form onSubmit={handleAddTrackFromSpotify} className="glass-panel p-4 rounded-2xl space-y-3 border border-white/10">
                    <div className="text-xs text-white/70 font-sans">
                      Paste Spotify Track Link or URI:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={e => setCustomUrlInput(e.target.value)}
                        placeholder="https://open.spotify.com/track/..."
                        className="flex-1 bg-surface text-white px-4 py-3 rounded-xl border border-white/10 text-xs font-sans focus:outline-none focus:border-spotify-green"
                      />
                      <button
                        type="submit"
                        disabled={isImportingTrack || !customUrlInput.trim()}
                        className="h-11 px-5 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                      >
                        {isImportingTrack ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Parsing...</span>
                          </>
                        ) : (
                          <span>Import Track</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {artistTracks.map(trk => (
                      <div
                        key={trk.id}
                        onClick={() => setSelectedTrack(trk)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedTrack?.id === trk.id
                            ? 'bg-spotify-green/15 border-spotify-green shadow-md'
                            : 'glass-panel hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={trk.albumArt}
                            alt={trk.title}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-xs font-bold text-white font-display">{trk.title}</div>
                            <div className="text-xs text-white/60 font-sans">
                              {trk.artist} • {trk.genre} • {trk.bpm || 124} BPM
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (audioState.currentTrack?.id === trk.id && audioState.isPlaying) {
                                pauseTrack();
                              } else {
                                playTrack(trk);
                              }
                            }}
                            className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                              audioState.currentTrack?.id === trk.id && audioState.isPlaying
                                ? 'bg-spotify-green text-black border-spotify-green'
                                : 'bg-white/5 text-white/70 hover:text-white hover:border-spotify-green border-white/10'
                            }`}
                            title={audioState.currentTrack?.id === trk.id && audioState.isPlaying ? 'Pause preview' : 'Preview track'}
                          >
                            {audioState.currentTrack?.id === trk.id && audioState.isPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>
                          {selectedTrack?.id === trk.id && (
                            <CheckCircle2 className="w-4 h-4 text-spotify-green" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  disabled={!selectedTrack}
                  onClick={() => setStep('configure_pitch')}
                  className="h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  Configure Pitch Options →
                </button>
              </div>
            </div>
          )}

          {step === 'configure_pitch' && (
            <div className="space-y-5">
              {/* Pitch Type Selection */}
              <div>
                <label className="text-xs font-display tracking-wider text-white mb-2 block font-bold">
                  CHOOSE SUBMISSION TIER
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Premium Option */}
                  <div
                    onClick={() => setPitchType('premium')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      pitchType === 'premium'
                        ? 'bg-spotify-green/15 border-spotify-green shadow-lg shadow-spotify-green/15'
                        : 'glass-panel hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-spotify-green text-[10px] font-sans font-bold text-black">
                        GUARANTEED REVIEW
                      </span>
                      <div className="text-xs font-bold font-sans text-white">
                        {cost} Credit{cost > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-sm font-bold font-display text-white">PREMIUM PITCH</div>
                    <ul className="text-xs text-white/70 font-sans mt-2 space-y-1">
                      <li>✓ Guaranteed 48h Curator Review</li>
                      <li>✓ Detailed Feedback Tags & Notes</li>
                      <li>✓ Direct Email Receipt & Live Status</li>
                      <li>✓ Bypass Follower Gates</li>
                    </ul>
                  </div>

                  {/* Free Option */}
                  <div
                    onClick={() => {
                      if (targetPlaylist.freePitchEnabled) {
                        setPitchType('free');
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all ${
                      !targetPlaylist.freePitchEnabled
                        ? 'opacity-40 cursor-not-allowed glass-panel'
                        : pitchType === 'free'
                        ? 'bg-spotify-green/15 border-spotify-green shadow-lg shadow-spotify-green/15 cursor-pointer'
                        : 'glass-panel hover:border-white/30 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-sans font-bold">
                        FREE WEEKLY ({freeWeeklyCredits}/2 REMAINING)
                      </span>
                      <div className="text-xs font-bold font-sans text-emerald-400">0 Credits</div>
                    </div>
                    <div className="text-sm font-bold font-display text-white">FREE GATE PITCH</div>
                    <ul className="text-xs text-white/70 font-sans mt-2 space-y-1">
                      <li>• Complete Curator Follower Gates</li>
                      <li>• 2 Free Weekly Pitches per user</li>
                      <li>• Standard Curator Queue</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CURATOR FOLLOWER GATES (IF FREE PITCH) */}
              {pitchType === 'free' && (
                <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-display text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      COMPLETE CURATOR FOLLOWER GATES
                    </span>
                    <span className="text-[11px] font-sans text-white/50">
                      Supports Curator Playlist Growth
                    </span>
                  </div>

                  <div className="space-y-2">
                    {needsCuratorFollow && (
                      <div className="p-3 rounded-xl bg-surface border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-spotify-green" />
                          <div>
                            <div className="text-xs font-sans text-white font-bold">
                              Follow {targetPlaylist.curatorName}
                            </div>
                            <div className="text-[11px] font-sans text-white/50">
                              Official Curator Spotify Account
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handlePerformGate(
                              'curator_follow',
                              targetPlaylist.gates?.curatorSpotifyProfileUrl || 'https://open.spotify.com'
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            gateFollowedCurator
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-spotify-green text-black hover:bg-spotify-green-hover'
                          }`}
                        >
                          {gateFollowedCurator ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Followed
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3 h-3" /> Follow on Spotify
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {needsPlaylistFollow && (
                      <div className="p-3 rounded-xl bg-surface border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-spotify-green" />
                          <div>
                            <div className="text-xs font-sans text-white font-bold">
                              Follow "{targetPlaylist.title}"
                            </div>
                            <div className="text-[11px] font-sans text-white/50">
                              Saves playlist to your Spotify library
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePerformGate('playlist_follow', targetPlaylist.spotifyUrl)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            gateFollowedPlaylist
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-spotify-green text-black hover:bg-spotify-green-hover'
                          }`}
                        >
                          {gateFollowedPlaylist ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Followed
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3 h-3" /> Follow Playlist
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {needsSongSave && (
                      <div className="p-3 rounded-xl bg-surface border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-spotify-green" />
                          <div>
                            <div className="text-xs font-sans text-white font-bold">
                              Save Curator Spotlight Track
                            </div>
                            <div className="text-[11px] font-sans text-white/50">
                              Adds track to your Liked Songs
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handlePerformGate(
                              'song_save',
                              targetPlaylist.gates?.targetSongSpotifyUrl || targetPlaylist.spotifyUrl
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            gateSavedSong
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-spotify-green text-black hover:bg-spotify-green-hover'
                          }`}
                        >
                          {gateSavedSong ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                            </>
                          ) : (
                            <>
                              <Heart className="w-3 h-3 fill-current" /> Save Song
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pitch Custom Note */}
              <div>
                <label className="text-xs font-display tracking-wider text-white mb-1.5 block font-bold">
                  PITCH MESSAGE TO CURATOR (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Tell the curator why this track fits their playlist vibe, notable syncs/radio support, or production details..."
                  className="w-full bg-surface text-white p-3.5 rounded-2xl border border-white/10 text-xs font-sans placeholder:text-white/40 focus:outline-none focus:border-spotify-green"
                />
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-sans flex items-center gap-2 ${
                    statusMessage.type === 'error'
                      ? 'bg-rose-950/40 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('select_track')}
                  className="text-xs font-sans text-white/60 hover:text-white cursor-pointer"
                >
                  ← Change Track
                </button>

                <div className="flex items-center gap-3">
                  {pitchType === 'premium' && !hasEnoughCredits && (
                    <button
                      type="button"
                      onClick={() => setBuyCreditsModalOpen(true)}
                      className="text-xs font-sans text-spotify-green hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" /> Top up credits ({currentUser.creditBalance} available)
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting || (pitchType === 'free' && !areAllGatesCompleted)}
                    onClick={handleSubmit}
                    className="h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-spotify-green/20 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Submitting to Queue...' : `Submit Pitch (${pitchType === 'free' ? 'Free Weekly' : `${cost} Credit`})`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-spotify-green/20 text-spotify-green border border-spotify-green/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white">PITCH SUBMITTED TO CURATOR!</h3>
                <p className="text-xs text-white/70 font-sans max-w-md mx-auto mt-1">
                  Your track <strong>"{selectedTrack?.title}"</strong> has been queued in <strong>{targetPlaylist.curatorName}'s</strong> inbox for <strong>{targetPlaylist.title}</strong>.
                </p>
              </div>

              <div className="glass-panel p-4 rounded-2xl max-w-sm mx-auto text-left text-xs font-sans space-y-1.5 border border-white/10">
                <div className="text-spotify-green font-bold uppercase tracking-wider text-[10px]">CAMPAIGN SUMMARY:</div>
                <div className="text-white">● Tier: {pitchType.toUpperCase()} PITCH</div>
                <div className="text-white">● Expected Response: ~{targetPlaylist.avgResponseHours} hours</div>
                <div className="text-white">● Automated Email: Sent to Curator</div>
                <div className="text-white">● Live Status: Real-Time Tracker Active</div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    closePitchModal();
                    setStep('select_track');
                  }}
                  className="h-11 px-8 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-spotify-green/20"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
