import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Link as LinkIcon,
  Music,
  CheckCircle2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { isSpotifyUrl } from '../../utils/spotifyParser';

export const GlobalAudioPlayer: React.FC = () => {
  const {
    audioState,
    playTrack,
    pauseTrack,
    resumeTrack,
    seekAudio,
    setVolume,
    toggleMute,
    toggleEmbedExpanded,
    playSpotifyUrl,
    playNextTrack,
    playPreviousTrack,
    openPitchModal
  } = useApp();

  const [inputUrl, setInputUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showQuickParser, setShowQuickParser] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!audioState.currentTrack) return null;

  const currentSec = Math.floor(audioState.currentTime);
  const totalSec = Math.floor(audioState.duration || 180);
  const progressPercent = totalSec > 0 ? Math.min(100, (audioState.currentTime / totalSec) * 100) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const ratio = Math.max(0, Math.min(1, clickX / width));
    const targetSeconds = ratio * totalSec;
    seekAudio(targetSeconds);
  };

  const handleParseAndPlay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsParsing(true);
    const success = await playSpotifyUrl(inputUrl.trim());
    setIsParsing(false);
    if (success) {
      setInputUrl('');
      setShowQuickParser(false);
    }
  };

  // Spotify Embed URL determination
  const embedSrc =
    audioState.embedUrl ||
    (audioState.activeSpotifyId
      ? `https://open.spotify.com/embed/${audioState.activeSpotifyType || 'track'}/${audioState.activeSpotifyId}?utm_source=generator&theme=0`
      : 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator&theme=0');

  // Minimized floating bubble
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-surface/95 border border-white/10 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => {
              if (audioState.isPlaying) {
                pauseTrack();
              } else {
                resumeTrack();
              }
            }}
            className="w-8 h-8 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow hover:scale-105 transition-transform cursor-pointer"
            title={audioState.isPlaying ? 'Pause' : 'Play'}
          >
            {audioState.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <div className="max-w-[120px] truncate">
            <div className="text-xs font-display font-bold text-white truncate">{audioState.currentTrack.title}</div>
            <div className="text-[10px] text-white/50 truncate font-sans">{audioState.currentTrack.artist}</div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Expand player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Spotify Footer Player"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.7)] transition-all duration-300"
    >
      {/* Slide-Up Spotify Iframe Drawer */}
      {audioState.isEmbedExpanded && (
        <div className="border-b border-white/10 bg-[#0c0c0c] px-4 py-3 animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-spotify-green animate-pulse" />
              <span className="text-xs font-display font-bold text-white tracking-wider flex items-center gap-1.5">
                <span>SPOTIFY EMBEDDED PLAYER</span>
                <span className="text-[10px] text-white/40 font-sans font-normal">Native Web Playback</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickParser(!showQuickParser)}
                className="text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-xl bg-surface border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5 text-spotify-green" />
                <span>Parse Any Spotify URL</span>
              </button>
              <button
                onClick={toggleEmbedExpanded}
                className="text-xs text-white/50 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Collapse embed"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <iframe
              src={embedSrc}
              width="100%"
              height="152"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="border-0 rounded-2xl"
              title="Spotify Native Web Player Embed"
            />
          </div>
        </div>
      )}

      {/* Slide-up Quick Spotify Link Parser Popover */}
      {showQuickParser && !audioState.isEmbedExpanded && (
        <div className="border-b border-white/10 bg-surface px-4 py-3 animate-fade-in">
          <form onSubmit={handleParseAndPlay} className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-spotify-green">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste any Spotify track, album, or playlist URL (e.g. https://open.spotify.com/track/...)"
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-spotify-green font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={isParsing || !inputUrl.trim()}
              className="px-4 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isParsing ? (
                <span>Parsing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Parse & Play</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowQuickParser(false)}
              className="text-xs text-white/50 hover:text-white px-3 py-1.5 rounded-lg"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Scrubbable Top Progress Bar */}
      <div
        ref={progressBarRef}
        onClick={handleSeek}
        className="group relative w-full h-1.5 bg-white/10 cursor-pointer hover:h-2 transition-all"
        title="Click to seek position"
      >
        <div
          className="h-full bg-spotify-green relative transition-[width] duration-150"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Main Player Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* 1. Track Info (Left) */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[280px] sm:max-w-xs md:max-w-sm">
          <button
            onClick={toggleEmbedExpanded}
            className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 group cursor-pointer shadow-md"
            title="Toggle Spotify Native Embed Player"
          >
            <img
              src={audioState.currentTrack.albumArt}
              alt={audioState.currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            {audioState.isPlaying && (
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-spotify-green ring-2 ring-black animate-pulse" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs sm:text-sm font-bold font-display text-white truncate hover:text-spotify-green transition-colors cursor-pointer" onClick={toggleEmbedExpanded}>
                {audioState.currentTrack.title}
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full bg-spotify-green/15 text-spotify-green text-[9px] font-sans font-bold flex-shrink-0 border border-spotify-green/30">
                SPOTIFY
              </span>
            </div>
            <div className="text-[11px] text-white/65 font-sans truncate flex items-center gap-1">
              <span>{audioState.currentTrack.artist}</span>
              {audioState.playlistContext && (
                <span className="text-white/40 truncate">• {audioState.playlistContext}</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Primary Transport Controls & Time (Center) */}
        <div className="flex flex-col items-center justify-center gap-1 flex-1 max-w-md">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Previous Track */}
            <button
              onClick={playPreviousTrack}
              className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              onClick={() => {
                if (audioState.isPlaying) {
                  pauseTrack();
                } else {
                  if (audioState.currentTime > 0) {
                    resumeTrack();
                  } else {
                    playTrack(audioState.currentTrack!, audioState.playlistContext);
                  }
                }
              }}
              className="w-10 h-10 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center transition-all shadow-lg shadow-spotify-green/25 hover:scale-105 active:scale-95 cursor-pointer"
              title={audioState.isPlaying ? 'Pause' : 'Play'}
            >
              {audioState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={playNextTrack}
              className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time scrubber text */}
          <div className="text-[11px] font-sans text-white/50 flex items-center gap-1 select-none">
            <span>{formatTime(currentSec)}</span>
            <span>/</span>
            <span>{formatTime(totalSec)}</span>
          </div>
        </div>

        {/* 3. Utility Tools: Volume, Spotify Embed, Quick Parser (Right) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Volume Slider */}
          <div className="hidden md:flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-white/60 hover:text-white transition-colors p-1"
              title={audioState.isMuted ? 'Unmute' : 'Mute'}
            >
              {audioState.isMuted || (audioState.volume ?? 0.8) === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioState.isMuted ? 0 : (audioState.volume ?? 0.8)}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-spotify-green"
              title="Volume"
            />
          </div>

          {/* Spotify Native Embed Toggle */}
          <button
            onClick={toggleEmbedExpanded}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer border ${
              audioState.isEmbedExpanded
                ? 'bg-spotify-green text-black border-spotify-green'
                : 'bg-surface text-white/80 hover:text-white border-white/10 hover:border-spotify-green/50'
            }`}
            title="Toggle Spotify Native Web Player"
          >
            <div className="w-2 h-2 rounded-full bg-spotify-green" />
            <span>Spotify Embed</span>
            {audioState.isEmbedExpanded ? (
              <ChevronDown className="w-3 h-3 ml-0.5" />
            ) : (
              <ChevronUp className="w-3 h-3 ml-0.5" />
            )}
          </button>

          {/* Quick Spotify Link Parser Trigger */}
          <button
            onClick={() => setShowQuickParser(!showQuickParser)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showQuickParser
                ? 'bg-spotify-green text-black border-spotify-green'
                : 'bg-surface border-white/10 text-white/70 hover:text-white hover:border-spotify-green/50'
            }`}
            title="Paste any Spotify link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Pitch Quick Action */}
          <button
            onClick={() => openPitchModal()}
            className="px-3 py-1.5 bg-spotify-green hover:bg-spotify-green-hover text-black font-display font-bold text-xs rounded-xl hidden lg:inline-flex items-center gap-1.5 shadow-md shadow-spotify-green/20 cursor-pointer transition-colors"
            title="Pitch this release to playlists"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pitch</span>
          </button>

          {/* Open in Spotify App / Web */}
          <a
            href={audioState.currentTrack.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-surface border border-white/10 text-white/70 hover:text-spotify-green hover:border-spotify-green/50 transition-colors"
            title="Open in Spotify Web / App"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Minimize Player Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-xl bg-surface border border-white/10 text-white/50 hover:text-white transition-colors"
            title="Minimize player"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
