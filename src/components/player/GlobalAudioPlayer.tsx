import React from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, X, ExternalLink, Volume2, Sparkles, Music2 } from 'lucide-react';

export const GlobalAudioPlayer: React.FC = () => {
  const { audioState, pauseTrack, playTrack, stopAudio, openPitchModal } = useApp();

  if (!audioState.currentTrack) return null;

  const current = Math.floor(audioState.currentTime);
  const dur = Math.floor(audioState.duration || 30);
  const progressPercent = dur > 0 ? (audioState.currentTime / dur) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414]/95 backdrop-blur-lg border-t border-[#3a3a3a] shadow-2xl px-4 py-2.5">
      {/* Top progress scrubber line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2b2b2b]">
        <div
          className="h-full bg-[#BE1E2F] transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Track Metadata */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-[#3a3a3a]">
            <img
              src={audioState.currentTrack.albumArt}
              alt={audioState.currentTrack.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {audioState.isPlaying && (
              <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-[#BE1E2F] animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-bold font-title text-white truncate flex items-center gap-1.5">
              <span>{audioState.currentTrack.title}</span>
              <span className="px-1.5 py-0.2 rounded bg-[#BE1E2F]/20 text-[#BE1E2F] text-[9px] font-mono-code font-bold">
                {audioState.currentTrack.genre}
              </span>
            </div>
            <div className="text-[11px] text-white/60 font-mono-code truncate">
              {audioState.currentTrack.artist}{' '}
              {audioState.playlistContext && (
                <span className="text-white/40">• via {audioState.playlistContext}</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Play/Pause and Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (audioState.isPlaying) {
                pauseTrack();
              } else {
                playTrack(audioState.currentTrack!, audioState.playlistContext);
              }
            }}
            className="w-10 h-10 rounded-full bg-[#BE1E2F] hover:bg-white text-white hover:text-[#BE1E2F] flex items-center justify-center transition-all shadow-md shadow-[#BE1E2F]/30 cursor-pointer"
            title={audioState.isPlaying ? 'Pause' : 'Play'}
          >
            {audioState.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="text-xs font-mono-code text-white/70 hidden sm:block">
            0:{current < 10 ? `0${current}` : current} / 0:{dur < 10 ? `0${dur}` : dur}
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openPitchModal()}
            className="btn-sane text-xs px-3 py-1.5 rounded-lg font-bold hidden md:inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pitch Release
          </button>

          <a
            href={audioState.currentTrack.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white hover:border-[#BE1E2F] transition-colors"
            title="Open in Spotify"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={stopAudio}
            className="p-2 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white transition-colors"
            title="Close player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
