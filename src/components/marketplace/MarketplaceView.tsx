import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Playlist } from '../../types';
import {
  Search,
  SlidersHorizontal,
  Shield,
  Play,
  Pause,
  ExternalLink,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  Filter,
  Radio
} from 'lucide-react';

export const MarketplaceView: React.FC = () => {
  const {
    playlists,
    openPitchModal,
    audioState,
    playTrack,
    pauseTrack
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [minFollowers, setMinFollowers] = useState<number>(0);
  const [onlyFreePitch, setOnlyFreePitch] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [maxResponseHours, setMaxResponseHours] = useState<number>(72);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const allGenres = [
    'All',
    'Deep House',
    'Melodic Techno',
    'Techno',
    'Indie Pop',
    'Synthwave',
    'Afrobeats',
    'Lo-Fi Chill',
    'Organic House'
  ];

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(playlist => {
      // Search query
      const matchesSearch =
        playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.curatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

      // Genre
      const matchesGenre =
        selectedGenre === 'All' || playlist.genres.includes(selectedGenre);

      // Follower count
      const matchesFollowers = playlist.followerCount >= minFollowers;

      // Free pitch
      const matchesFree = !onlyFreePitch || playlist.freePitchEnabled;

      // Verified
      const matchesVerified = !onlyVerified || playlist.isVerified;

      // Response time
      const matchesResponse = playlist.avgResponseHours <= maxResponseHours;

      return (
        matchesSearch &&
        matchesGenre &&
        matchesFollowers &&
        matchesFree &&
        matchesVerified &&
        matchesResponse
      );
    });
  }, [
    playlists,
    searchQuery,
    selectedGenre,
    minFollowers,
    onlyFreePitch,
    onlyVerified,
    maxResponseHours
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Marketplace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#3a3a3a]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-[#BE1E2F]">
            <Zap className="w-4 h-4 fill-current" />
            <span>PLAYLIST DISCOVERY & CURATION MARKETPLACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-title text-white mt-1">
            EXPLORE SPOTIFY PLAYLISTS ({filteredPlaylists.length})
          </h1>
          <p className="text-xs text-white/60 font-mono-code mt-0.5">
            Target high-converting playlists matching your sound profile & submit your releases.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search playlist, genre, curator..."
            className="w-full bg-[#2b2b2b] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#3a3a3a] text-xs font-mono-code placeholder:text-white/40 focus:outline-none focus:border-[#BE1E2F]"
          />
        </div>
      </div>

      {/* Genre Chips Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {allGenres.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-code whitespace-nowrap transition-all border ${
              selectedGenre === genre
                ? 'bg-[#BE1E2F] text-white border-[#BE1E2F] font-bold shadow-md shadow-[#BE1E2F]/20'
                : 'bg-[#2b2b2b] text-white/70 border-[#3a3a3a] hover:text-white hover:border-white/40'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Main Layout: Sidebar Filters + Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="w-full card-sane py-2.5 px-4 rounded-xl flex items-center justify-between text-xs font-mono-code text-white border border-[#3a3a3a]"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#BE1E2F]" /> Filter Playlists
            </span>
            <span className="text-[#BE1E2F] font-bold">{mobileFilterOpen ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* Filter Sidebar */}
        <div
          className={`${
            mobileFilterOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-1 space-y-5`}
        >
          <div className="card-sane p-5 rounded-xl border border-[#3a3a3a] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#3a3a3a]">
              <span className="text-xs font-title font-bold tracking-wider text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#BE1E2F]" />
                FILTER OPTIONS
              </span>
              <button
                onClick={() => {
                  setSelectedGenre('All');
                  setMinFollowers(0);
                  setOnlyFreePitch(false);
                  setOnlyVerified(false);
                  setMaxResponseHours(72);
                  setSearchQuery('');
                }}
                className="text-[10px] font-mono-code text-[#BE1E2F] hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Min Followers Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono-code mb-2">
                <span className="text-white/70">Min Followers:</span>
                <span className="text-[#BE1E2F] font-bold">
                  {minFollowers > 0 ? `${(minFollowers / 1000).toFixed(0)}k+` : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={minFollowers}
                onChange={e => setMinFollowers(Number(e.target.value))}
                className="w-full accent-[#BE1E2F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono-code text-white/40 mt-1">
                <span>0</span>
                <span>50k</span>
                <span>100k+</span>
              </div>
            </div>

            {/* Max Response Time Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono-code mb-2">
                <span className="text-white/70">Max Response Time:</span>
                <span className="text-amber-400 font-bold">{maxResponseHours}h</span>
              </div>
              <input
                type="range"
                min="12"
                max="72"
                step="12"
                value={maxResponseHours}
                onChange={e => setMaxResponseHours(Number(e.target.value))}
                className="w-full accent-[#BE1E2F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono-code text-white/40 mt-1">
                <span>12h</span>
                <span>24h</span>
                <span>48h</span>
                <span>72h</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-3 border-t border-[#3a3a3a]">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-mono-code text-white/80 group-hover:text-white">
                  Free Spotlight Pitch Only
                </span>
                <input
                  type="checkbox"
                  checked={onlyFreePitch}
                  onChange={e => setOnlyFreePitch(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#BE1E2F] bg-[#1a1a1a] border-[#3a3a3a]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-mono-code text-white/80 group-hover:text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#BE1E2F]" />
                  Verified Curators Only
                </span>
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={e => setOnlyVerified(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#BE1E2F] bg-[#1a1a1a] border-[#3a3a3a]"
                />
              </label>
            </div>

            {/* Pitch Cost Explainer */}
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#3a3a3a] text-[11px] font-mono-code text-white/60 space-y-1">
              <div className="text-white font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#BE1E2F]" /> PITCH OPTIONS
              </div>
              <div>• <strong>Free Pitch:</strong> Listen to 30s spotlight track</div>
              <div>• <strong>Premium Pitch:</strong> 1-2 credits, 48h review guarantee</div>
            </div>
          </div>
        </div>

        {/* Playlists Grid */}
        <div className="lg:col-span-3">
          {filteredPlaylists.length === 0 ? (
            <div className="card-sane p-12 text-center rounded-xl border border-[#3a3a3a]">
              <Radio className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-lg font-title text-white">No playlists match your filters</h3>
              <p className="text-xs text-white/60 font-mono-code mt-1">
                Try widening your follower filter or clearing genre tags.
              </p>
              <button
                onClick={() => {
                  setSelectedGenre('All');
                  setMinFollowers(0);
                  setOnlyFreePitch(false);
                  setOnlyVerified(false);
                  setMaxResponseHours(72);
                  setSearchQuery('');
                }}
                className="btn-sane text-xs px-4 py-2 rounded-lg font-bold mt-4"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlaylists.map(playlist => {
                const isPlayingThis =
                  audioState.isPlaying &&
                  playlist.spotlightTrack &&
                  audioState.currentTrack?.id === playlist.spotlightTrack.id;

                return (
                  <div
                    key={playlist.id}
                    className="card-sane p-4 rounded-xl border border-[#3a3a3a] hover:border-[#BE1E2F] transition-all flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      {/* Top Bar: Cover Art + Main Meta */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[#3a3a3a] shadow-md">
                          <img
                            src={playlist.coverArt}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {playlist.spotlightTrack && (
                            <button
                              onClick={() => {
                                if (isPlayingThis) {
                                  pauseTrack();
                                } else {
                                  playTrack(playlist.spotlightTrack!, playlist.title);
                                }
                              }}
                              className={`absolute inset-0 flex items-center justify-center transition-all ${
                                isPlayingThis
                                  ? 'bg-[#BE1E2F]/80 text-white'
                                  : 'bg-black/40 opacity-0 group-hover:opacity-100 text-white hover:bg-black/60'
                              }`}
                              title="Play spotlight preview"
                            >
                              {isPlayingThis ? (
                                <Pause className="w-6 h-6 fill-current" />
                              ) : (
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-sm font-bold font-title text-white truncate leading-tight group-hover:text-[#BE1E2F] transition-colors">
                              {playlist.title}
                            </h3>
                            {playlist.isVerified && (
                              <span
                                className="px-1.5 py-0.5 bg-[#BE1E2F]/15 text-[#BE1E2F] rounded text-[9px] font-mono-code font-bold flex items-center gap-1 border border-[#BE1E2F]/30"
                                title="Verified Spotify Curator"
                              >
                                <Shield className="w-2.5 h-2.5" /> VERIFIED
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-white/70 truncate font-mono-code mt-0.5 flex items-center gap-1">
                            <span>by {playlist.curatorName}</span>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-1 mt-2 bg-[#1a1a1a] p-2 rounded-lg border border-[#3a3a3a]/60 text-[10px] font-mono-code">
                            <div>
                              <div className="text-white/40">FOLLOWERS</div>
                              <div className="font-bold text-white">
                                {playlist.followerCount >= 1000
                                  ? `${(playlist.followerCount / 1000).toFixed(1)}k`
                                  : playlist.followerCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-white/40">APPROVAL</div>
                              <div className="font-bold text-emerald-400">
                                {playlist.approvalRate}%
                              </div>
                            </div>
                            <div>
                              <div className="text-white/40">RESPONDS</div>
                              <div className="font-bold text-amber-300">
                                ~{playlist.avgResponseHours}h
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-white/60 mt-3 line-clamp-2 leading-relaxed">
                        {playlist.description}
                      </p>

                      {/* Genre Badges */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {playlist.genres.map(genre => (
                          <span
                            key={genre}
                            className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[10px] font-mono-code text-white/70 border border-[#3a3a3a]"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-[#3a3a3a] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {playlist.freePitchEnabled ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono-code font-bold border border-emerald-500/30">
                            FREE PITCH
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono-code font-bold border border-amber-500/30">
                            PREMIUM ONLY
                          </span>
                        )}
                        <span className="text-[11px] font-mono-code text-white/50">
                          {playlist.pitchCostCredits} Credit{playlist.pitchCostCredits > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={playlist.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] text-white/60 hover:text-white hover:border-[#BE1E2F] transition-colors"
                          title="Open in Spotify"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => openPitchModal(playlist)}
                          className="btn-sane text-xs px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-[#BE1E2F]/20 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          PITCH SONG
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
