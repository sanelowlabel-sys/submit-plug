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
  ExternalLink
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
    setBuyCreditsModalOpen,
    playTrack
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

  // Spotlight free listen state
  const [spotlightListening, setSpotlightListening] = useState(false);
  const [spotlightElapsedSec, setSpotlightElapsedSec] = useState(0);
  const SPOTLIGHT_REQUIRED_SEC = 30;

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

  if (!pitchModalOpen) return null;

  const targetPlaylist = playlists.find(p => p.id === selectedPlaylistId) || playlists[0];
  const cost = pitchType === 'premium' ? (targetPlaylist?.pitchCostCredits || 1) : 0;
  const hasEnoughCredits = currentUser.creditBalance >= cost;
  const isFreeSpotlightComplete = spotlightElapsedSec >= SPOTLIGHT_REQUIRED_SEC;

  // Spotlight Listen Engine
  const startSpotlightListen = () => {
    if (!targetPlaylist?.spotlightTrack) return;
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

  const handleAddTrackFromSpotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    // Simulate Spotify API track metadata lookup
    const idMatch = customUrlInput.match(/track\/([a-zA-Z0-9]+)/);
    const spotifyId = idMatch ? idMatch[1] : `trk_${Date.now()}`;

    const newTrack: Track = {
      id: `trk_${Date.now()}`,
      title: customUrlInput.includes('track') ? 'Cosmic Resonance' : 'Custom Imported Release',
      artist: currentUser.name,
      albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      spotifyUrl: customUrlInput.startsWith('http') ? customUrlInput : `https://open.spotify.com/track/${spotifyId}`,
      spotifyUri: `spotify:track:${spotifyId}`,
      previewUrl: 'https://actions.google.com/sounds/v1/science_fiction/deep_pulse.ogg',
      durationSec: 210,
      genre: targetPlaylist?.genres[0] || 'Melodic Techno',
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

    if (pitchType === 'free' && !isFreeSpotlightComplete) {
      setStatusMessage({
        type: 'error',
        text: `Please complete listening to the 30-second spotlight track (${spotlightElapsedSec}/30s listened).`
      });
      return;
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
      spotlightDuration: pitchType === 'free' ? spotlightElapsedSec : undefined
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
            className="w-8 h-8 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white flex items-center justify-center"
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
                    className="text-[11px] font-mono-code text-[#BE1E2F] hover:underline"
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
                      <button type="submit" className="btn-sane text-xs px-4 py-2 rounded-lg font-bold">
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
                            className="p-1.5 rounded-lg bg-[#2b2b2b] text-white/70 hover:text-white hover:border-[#BE1E2F] border border-[#3a3a3a]"
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
                  CHOOSE PITCH TIER
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
                        RECOMMENDED
                      </span>
                      <div className="text-xs font-bold font-mono-code text-white">
                        {cost} Credit{cost > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-sm font-bold font-title text-white">PREMIUM PITCH</div>
                    <ul className="text-[11px] text-white/70 font-mono-code mt-2 space-y-1">
                      <li>✓ Guaranteed 48h Curator Review</li>
                      <li>✓ Detailed Feedback tags if declined</li>
                      <li>✓ Custom note directly to curator</li>
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
                        FREE TIER
                      </span>
                      <div className="text-xs font-bold font-mono-code text-emerald-400">0 Credits</div>
                    </div>
                    <div className="text-sm font-bold font-title text-white">FREE SPOTLIGHT PITCH</div>
                    <ul className="text-[11px] text-white/70 font-mono-code mt-2 space-y-1">
                      <li>• Requires 30-sec spotlight listen</li>
                      <li>• Standard curator review queue</li>
                      <li>• Limited to 1 free pitch / week</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Free Spotlight Audio Listening Gate (if Free pitch selected) */}
              {pitchType === 'free' && targetPlaylist.spotlightTrack && (
                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#3a3a3a] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-title text-white">
                      <Headphones className="w-4 h-4 text-[#BE1E2F]" />
                      SPOTLIGHT REQUIREMENT: LISTEN 30 SECONDS
                    </div>
                    <span className="text-xs font-mono-code text-amber-300 font-bold">
                      {spotlightElapsedSec} / {SPOTLIGHT_REQUIRED_SEC}s
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#2b2b2b] h-2 rounded-full overflow-hidden border border-[#3a3a3a]">
                    <div
                      className="bg-[#BE1E2F] h-full transition-all duration-300"
                      style={{ width: `${(spotlightElapsedSec / SPOTLIGHT_REQUIRED_SEC) * 100}%` }}
                    />
                  </div>

                  {/* Spotlight Track Player Bar */}
                  <div className="flex items-center justify-between bg-[#2b2b2b] p-2.5 rounded-lg border border-[#3a3a3a]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={targetPlaylist.spotlightTrack.albumArt}
                        alt={targetPlaylist.spotlightTrack.title}
                        className="w-8 h-8 rounded object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-bold text-white font-title">
                          {targetPlaylist.spotlightTrack.title}
                        </div>
                        <div className="text-[10px] text-white/60 font-mono-code">
                          {targetPlaylist.spotlightTrack.artist} (Curator Spotlight)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (spotlightListening) {
                          pauseSpotlightListen();
                        } else {
                          startSpotlightListen();
                        }
                      }}
                      className="btn-sane text-xs px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      {spotlightListening ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                        </>
                      ) : isFreeSpotlightComplete ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Completed
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Listen 30s
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Pitch Custom Note (for Premium) */}
              {pitchType === 'premium' && (
                <div>
                  <label className="text-xs font-title tracking-wider text-white mb-1.5 block">
                    PITCH MESSAGE TO CURATOR (OPTIONAL)
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    placeholder="Tell the curator why this track fits their playlist vibe, notable syncs/radio support, or production details..."
                    className="w-full bg-[#1a1a1a] text-white p-3 rounded-xl border border-[#3a3a3a] text-xs font-mono-code placeholder:text-white/40 focus:outline-none focus:border-[#BE1E2F]"
                  />
                </div>
              )}

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
                  className="text-xs font-mono-code text-white/60 hover:text-white"
                >
                  ← Change Track
                </button>

                <div className="flex items-center gap-3">
                  {pitchType === 'premium' && !hasEnoughCredits && (
                    <button
                      type="button"
                      onClick={() => setBuyCreditsModalOpen(true)}
                      className="text-xs font-mono-code text-[#BE1E2F] hover:underline flex items-center gap-1 font-bold"
                    >
                      <Coins className="w-3.5 h-3.5" /> Top up credits ({currentUser.creditBalance} available)
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting || (pitchType === 'free' && !isFreeSpotlightComplete)}
                    onClick={handleSubmit}
                    className="btn-sane text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#BE1E2F]/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Submitting...' : `Submit Pitch (${pitchType === 'free' ? 'Free' : `${cost} Credit`})`}
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
                <div className="text-white">● Track Status: Pending Curator Review</div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    closePitchModal();
                    setStep('select_track');
                  }}
                  className="btn-sane text-xs px-6 py-2 rounded-lg font-bold"
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
