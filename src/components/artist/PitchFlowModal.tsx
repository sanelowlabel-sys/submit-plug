import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Track, Playlist, PitchType } from '../../types';
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
  Heart
} from 'lucide-react';
import { globalAudioEngine } from '../../utils/audioEngine';

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
    verifyGateAction
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

  if (!pitchModalOpen) return null;

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

  const cost = pitchType === 'premium' ? (targetPlaylist.pitchCostCredits || 1) : 0;
  const hasEnoughCredits = currentUser.creditBalance >= cost;
  const isFreeSpotlightComplete = spotlightElapsedSec >= SPOTLIGHT_REQUIRED_SEC;

  // Gate check for free pitches
  const needsCuratorFollow = targetPlaylist.gates?.requireCuratorFollow ?? true;
  const needsPlaylistFollow = targetPlaylist.gates?.requirePlaylistFollow ?? true;
  const needsSongSave = targetPlaylist.gates?.requireSongSave ?? false;

  const areAllGatesCompleted =
    (!needsCuratorFollow || gateFollowedCurator) &&
    (!needsPlaylistFollow || gateFollowedPlaylist) &&
    (!needsSongSave || gateSavedSong);

  // Spotlight Listen Engine
  const startSpotlightListen = () => {
    if (!targetPlaylist.spotlightTrack) return;
    setSpotlightListening(true);

    globalAudioEngine.playTrack(
      targetPlaylist.spotlightTrack,
      (current) => {
        setSpotlightElapsedSec(Math.min(SPOTLIGHT_REQUIRED_SEC, Math.floor(current)));
      },
      () => {
        setSpotlightListening(false);
        setSpotlightElapsedSec(SPOTLIGHT_REQUIRED_SEC);
      }
    );
  };

  const pauseSpotlightListen = () => {
    globalAudioEngine.stop();
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

  const handleAddTrackFromSpotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    const idMatch = customUrlInput.match(/track\/([a-zA-Z0-9]+)/);
    const spotifyId = idMatch ? idMatch[1] : `trk_${Date.now()}`;

    const newTrack: Track = {
      id: `trk_${Date.now()}`,
      title: customUrlInput.includes('track') ? 'Cosmic Frequency' : 'New Imported Master',
      artist: currentUser.name,
      albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      spotifyUrl: customUrlInput.startsWith('http') ? customUrlInput : `https://open.spotify.com/track/${spotifyId}`,
      spotifyUri: `spotify:track:${spotifyId}`,
      previewUrl: 'https://actions.google.com/sounds/v1/science_fiction/deep_pulse.ogg',
      durationSec: 210,
      genre: targetPlaylist.genres?.[0] || 'Electronic',
      bpm: 125,
      key: 'D Minor',
      releaseDate: new Date().toISOString().split('T')[0]
    };

    addArtistTrack(newTrack);
    setSelectedTrack(newTrack);
    setShowAddCustomTrack(false);
    setCustomUrlInput('');
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
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card-sane w-full max-w-2xl rounded-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3a3a3a] flex items-center justify-between bg-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#BE1E2F] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-title text-white">SUBMIT TRACK PITCH</h3>
              <div className="text-[11px] font-mono-code text-white/50">
                Direct Submission to Spotify Curators
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              pauseSpotlightListen();
              closePitchModal();
            }}
            className="w-8 h-8 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {step === 'select_track' && (
            <div className="space-y-5">
              {/* Target Playlist Banner */}
              <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-[#3a3a3a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={targetPlaylist.coverArt}
                    alt={targetPlaylist.title}
                    className="w-12 h-12 rounded-lg object-cover border border-[#3a3a3a]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-[10px] font-mono-code text-[#BE1E2F] font-bold">TARGET PLAYLIST</div>
                    <div className="text-sm font-bold text-white font-title truncate max-w-[240px] sm:max-w-xs">
                      {targetPlaylist.title}
                    </div>
                    <div className="text-xs text-white/60 font-mono-code">
                      by {targetPlaylist.curatorName} • {targetPlaylist.followerCount.toLocaleString()} followers
                    </div>
                  </div>
                </div>

                <select
                  value={selectedPlaylistId}
                  onChange={e => setSelectedPlaylistId(e.target.value)}
                  className="bg-[#2b2b2b] text-white text-xs font-mono-code py-1.5 px-3 rounded-lg border border-[#3a3a3a] focus:outline-none focus:border-[#BE1E2F] max-w-[140px]"
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
                  <label className="text-xs font-title tracking-wider text-white flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-[#BE1E2F]" />
                    SELECT SPOTIFY RELEASE TO PITCH
                  </label>
                  <button
                    onClick={() => setShowAddCustomTrack(!showAddCustomTrack)}
                    className="text-[11px] font-mono-code text-[#BE1E2F] hover:underline cursor-pointer"
                  >
                    {showAddCustomTrack ? 'Pick from catalog' : '+ Paste Spotify URL'}
                  </button>
                </div>

                {showAddCustomTrack ? (
                  <form onSubmit={handleAddTrackFromSpotify} className="card-panel p-3 rounded-xl space-y-2">
                    <div className="text-xs text-white/70 font-mono-code">
                      Paste Spotify Track Link or URI:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={e => setCustomUrlInput(e.target.value)}
                        placeholder="https://open.spotify.com/track/..."
                        className="flex-1 bg-[#2b2b2b] text-white px-3 py-2 rounded-lg border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
                      />
                      <button type="submit" className="btn-sane text-xs px-4 py-2 rounded-lg font-bold cursor-pointer">
                        Import
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {artistTracks.map(trk => (
                      <div
                        key={trk.id}
                        onClick={() => setSelectedTrack(trk)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedTrack?.id === trk.id
                            ? 'bg-[#BE1E2F]/15 border-[#BE1E2F] shadow-md'
                            : 'card-panel hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={trk.albumArt}
                            alt={trk.title}
                            className="w-10 h-10 rounded-lg object-cover border border-[#3a3a3a]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-xs font-bold text-white font-title">{trk.title}</div>
                            <div className="text-[11px] text-white/60 font-mono-code">
                              {trk.artist} • {trk.genre} • {trk.bpm || 124} BPM
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTrack(trk);
                            }}
                            className="p-1.5 rounded-lg bg-[#2b2b2b] text-white/70 hover:text-white hover:border-[#BE1E2F] border border-[#3a3a3a] cursor-pointer"
                            title="Preview track"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          {selectedTrack?.id === trk.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#BE1E2F]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-[#3a3a3a] flex justify-end">
                <button
                  disabled={!selectedTrack}
                  onClick={() => setStep('configure_pitch')}
                  className="btn-sane text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                <label className="text-xs font-title tracking-wider text-white mb-2 block">
                  CHOOSE SUBMISSION TIER
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Premium Option */}
                  <div
                    onClick={() => setPitchType('premium')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      pitchType === 'premium'
                        ? 'bg-[#BE1E2F]/15 border-[#BE1E2F] shadow-lg shadow-[#BE1E2F]/15'
                        : 'card-panel hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-[#BE1E2F] text-[9px] font-mono-code font-bold text-white">
                        GUARANTEED REVIEW
                      </span>
                      <div className="text-xs font-bold font-mono-code text-white">
                        {cost} Credit{cost > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-sm font-bold font-title text-white">PREMIUM PITCH</div>
                    <ul className="text-[11px] text-white/70 font-mono-code mt-2 space-y-1">
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
                    className={`p-4 rounded-xl border transition-all ${
                      !targetPlaylist.freePitchEnabled
                        ? 'opacity-40 cursor-not-allowed card-panel'
                        : pitchType === 'free'
                        ? 'bg-[#BE1E2F]/15 border-[#BE1E2F] shadow-lg shadow-[#BE1E2F]/15 cursor-pointer'
                        : 'card-panel hover:border-white/30 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono-code font-bold">
                        FREE WEEKLY ({freeWeeklyCredits}/2 REMAINING)
                      </span>
                      <div className="text-xs font-bold font-mono-code text-emerald-400">0 Credits</div>
                    </div>
                    <div className="text-sm font-bold font-title text-white">FREE GATE PITCH</div>
                    <ul className="text-[11px] text-white/70 font-mono-code mt-2 space-y-1">
                      <li>• Complete Curator Follower Gates</li>
                      <li>• 2 Free Weekly Pitches per user</li>
                      <li>• Standard Curator Queue</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CURATOR FOLLOWER GATES (IF FREE PITCH) */}
              {pitchType === 'free' && (
                <div className="bg-[#161616] p-4 rounded-xl border border-[#3a3a3a] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-title text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      COMPLETE CURATOR FOLLOWER GATES
                    </span>
                    <span className="text-[10px] font-mono-code text-white/50">
                      Supports Curator Playlist Growth
                    </span>
                  </div>

                  <div className="space-y-2">
                    {needsCuratorFollow && (
                      <div className="p-3 rounded-lg bg-[#1f1f1f] border border-[#333] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-[#1DB954]" />
                          <div>
                            <div className="text-xs font-mono-code text-white font-bold">
                              Follow {targetPlaylist.curatorName}
                            </div>
                            <div className="text-[10px] font-mono-code text-white/50">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            gateFollowedCurator
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#1DB954] text-black hover:bg-[#1ed760]'
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
                      <div className="p-3 rounded-lg bg-[#1f1f1f] border border-[#333] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-[#1DB954]" />
                          <div>
                            <div className="text-xs font-mono-code text-white font-bold">
                              Follow "{targetPlaylist.title}"
                            </div>
                            <div className="text-[10px] font-mono-code text-white/50">
                              Saves playlist to your Spotify library
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePerformGate('playlist_follow', targetPlaylist.spotifyUrl)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            gateFollowedPlaylist
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#1DB954] text-black hover:bg-[#1ed760]'
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
                      <div className="p-3 rounded-lg bg-[#1f1f1f] border border-[#333] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-[#BE1E2F]" />
                          <div>
                            <div className="text-xs font-mono-code text-white font-bold">
                              Save Curator Spotlight Track
                            </div>
                            <div className="text-[10px] font-mono-code text-white/50">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            gateSavedSong
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#BE1E2F] text-white hover:bg-[#a01826]'
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
                <label className="text-xs font-title tracking-wider text-white mb-1.5 block">
                  PITCH MESSAGE TO CURATOR (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Tell the curator why this track fits their playlist vibe, notable syncs/radio support, or production details..."
                  className="w-full bg-[#1a1a1a] text-white p-3 rounded-xl border border-[#3a3a3a] text-xs font-mono-code placeholder:text-white/40 focus:outline-none focus:border-[#BE1E2F]"
                />
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono-code flex items-center gap-2 ${
                    statusMessage.type === 'error'
                      ? 'bg-rose-900/30 text-rose-300 border border-rose-800'
                      : 'bg-emerald-900/30 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#3a3a3a] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('select_track')}
                  className="text-xs font-mono-code text-white/60 hover:text-white cursor-pointer"
                >
                  ← Change Track
                </button>

                <div className="flex items-center gap-3">
                  {pitchType === 'premium' && !hasEnoughCredits && (
                    <button
                      type="button"
                      onClick={() => setBuyCreditsModalOpen(true)}
                      className="text-xs font-mono-code text-[#BE1E2F] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" /> Top up credits ({currentUser.creditBalance} available)
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting || (pitchType === 'free' && !areAllGatesCompleted)}
                    onClick={handleSubmit}
                    className="btn-sane text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#BE1E2F]/20"
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
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-title text-white">PITCH SUBMITTED TO CURATOR!</h3>
                <p className="text-xs text-white/70 font-mono-code max-w-md mx-auto mt-1">
                  Your track <strong>"{selectedTrack?.title}"</strong> has been queued in <strong>{targetPlaylist.curatorName}'s</strong> inbox for <strong>{targetPlaylist.title}</strong>.
                </p>
              </div>

              <div className="card-panel p-3.5 rounded-xl max-w-sm mx-auto text-left text-xs font-mono-code space-y-1">
                <div className="text-white/50">CAMPAIGN SUMMARY:</div>
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
                  className="btn-sane text-xs px-6 py-2 rounded-lg font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
