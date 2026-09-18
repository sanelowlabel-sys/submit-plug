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
    pauseTrack,
    playSpotifyUrl,
    switchUserRole,
    setOnboardPlaylistModalOpen
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
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (playlist.title || '').toLowerCase().includes(q) ||
        (playlist.curatorName || '').toLowerCase().includes(q) ||
        (playlist.genres || []).some(g => (g || '').toLowerCase().includes(q));

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Marketplace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans text-spotify-green font-semibold">
            <Zap className="w-4 h-4 fill-current" />
            <span>PLAYLIST DISCOVERY & CURATION MARKETPLACE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white mt-1">
            EXPLORE SPOTIFY PLAYLISTS ({filteredPlaylists.length})
          </h1>
          <p className="text-sm text-white/60 font-sans mt-1">
            Target high-converting playlists matching your sound profile & submit your releases.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search playlist, genre, curator..."
            className="w-full bg-surface text-white pl-11 pr-4 py-3 rounded-2xl border border-white/10 text-sm font-sans placeholder:text-white/40 focus:outline-none focus:border-spotify-green transition-colors"
          />
        </div>
      </div>

      {/* Genre Chips Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-5 scrollbar-none">
        {allGenres.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold tracking-wide whitespace-nowrap transition-all border cursor-pointer ${
              selectedGenre === genre
                ? 'bg-spotify-green text-black border-spotify-green shadow-md shadow-spotify-green/20'
                : 'bg-surface text-white/70 border-white/10 hover:text-white hover:border-white/30'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Main Layout: Sidebar Filters + Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-2">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="w-full glass-panel py-3 px-4 rounded-2xl flex items-center justify-between text-xs font-display font-bold text-white border border-white/10 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-spotify-green" /> Filter Playlists
            </span>
            <span className="text-spotify-green font-bold">{mobileFilterOpen ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* Filter Sidebar */}
        <div
          className={`${
            mobileFilterOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-1 space-y-5`}
        >
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-display font-bold tracking-wider text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-spotify-green" />
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
                className="text-xs font-sans text-spotify-green hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Min Followers Slider */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-2">
                <span className="text-white/70">Min Followers:</span>
                <span className="text-spotify-green font-bold">
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
                className="w-full accent-spotify-green cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-sans text-white/40 mt-1">
                <span>0</span>
                <span>50k</span>
                <span>100k+</span>
              </div>
            </div>

            {/* Max Response Time Slider */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-2">
                <span className="text-white/70">Max Response Time:</span>
                <span className="text-spotify-green font-bold">{maxResponseHours}h</span>
              </div>
              <input
                type="range"
                min="12"
                max="72"
                step="12"
                value={maxResponseHours}
                onChange={e => setMaxResponseHours(Number(e.target.value))}
                className="w-full accent-spotify-green cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-sans text-white/40 mt-1">
                <span>12h</span>
                <span>24h</span>
                <span>48h</span>
                <span>72h</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-sans text-white/80 group-hover:text-white">
                  Free Spotlight Pitch Only
                </span>
                <input
                  type="checkbox"
                  checked={onlyFreePitch}
                  onChange={e => setOnlyFreePitch(e.target.checked)}
                  className="w-4 h-4 rounded accent-spotify-green bg-surface border-white/10"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-sans text-white/80 group-hover:text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-spotify-green" />
                  Verified Curators Only
                </span>
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={e => setOnlyVerified(e.target.checked)}
                  className="w-4 h-4 rounded accent-spotify-green bg-surface border-white/10"
                />
              </label>
            </div>

            {/* Pitch Cost Explainer */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs font-sans text-white/60 space-y-1.5">
              <div className="text-white font-bold flex items-center gap-1.5 font-display">
                <Sparkles className="w-3.5 h-3.5 text-spotify-green" /> PITCH OPTIONS
              </div>
              <div>• <strong className="text-white">Free Pitch:</strong> Listen to 30s spotlight track</div>
              <div>• <strong className="text-white">Premium Pitch:</strong> 1-2 credits, 48h review guarantee</div>
            </div>
          </div>
        </div>

        {/* Playlists Grid */}
        <div className="lg:col-span-3">
          {filteredPlaylists.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-spotify-green/15 text-spotify-green flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8" />
              </div>
              {playlists.length === 0 ? (
                <>
                  <h3 className="text-xl font-display font-bold text-white">
                    REAL-TIME PLAYLIST DIRECTORY AWAITING CURATORS
                  </h3>
                  <p className="text-xs text-white/60 font-sans max-w-md mx-auto leading-relaxed">
                    Only authentic Spotify playlists submitted by curators in real time will appear here.
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        switchUserRole('curator');
                        setOnboardPlaylistModalOpen(true);
                      }}
                      className="h-12 px-6 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" /> SUBMIT PLAYLIST AS CURATOR
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-display text-white">No playlists match your filters</h3>
                  <p className="text-xs text-white/60 font-sans mt-1">
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
                    className="h-10 px-5 bg-spotify-green text-black font-bold rounded-xl mt-3 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPlaylists.map(playlist => {
                const isPlayingThis =
                  audioState.isPlaying &&
                  playlist.spotlightTrack &&
                  audioState.currentTrack?.id === playlist.spotlightTrack.id;

                return (
                  <div
                    key={playlist.id}
                    className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-spotify-green/40 transition-all flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      {/* Top Bar: Cover Art + Main Meta */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
                          <img
                            src={playlist.coverArt}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => {
                              if (isPlayingThis) {
                                pauseTrack();
                              } else if (playlist.spotlightTrack) {
                                playTrack(playlist.spotlightTrack, playlist.title);
                              } else {
                                playSpotifyUrl(playlist.spotifyUrl, playlist.title);
                              }
                            }}
                            className={`absolute inset-0 flex items-center justify-center transition-all ${
                              isPlayingThis
                                ? 'bg-spotify-green/90 text-black'
                                : 'bg-black/50 opacity-0 group-hover:opacity-100 text-white hover:bg-black/70'
                            }`}
                            title={playlist.spotlightTrack ? 'Play spotlight preview' : 'Play playlist on Spotify player'}
                          >
                            {isPlayingThis ? (
                              <Pause className="w-7 h-7 fill-current" />
                            ) : (
                              <Play className="w-7 h-7 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-base font-display font-bold text-white truncate leading-tight group-hover:text-spotify-green transition-colors">
                              {playlist.title}
                            </h3>
                            {playlist.isVerified && (
                              <span
                                className="px-2 py-0.5 bg-spotify-green/15 text-spotify-green rounded-full text-[10px] font-sans font-bold flex items-center gap-1 border border-spotify-green/30 shrink-0"
                                title="Verified Spotify Curator"
                              >
                                <Shield className="w-3 h-3" /> VERIFIED
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-white/70 truncate font-sans mt-0.5 flex items-center gap-1">
                            <span>by {playlist.curatorName}</span>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-1.5 mt-2.5 bg-white/5 p-2 rounded-xl border border-white/10 text-[10px] font-sans">
                            <div>
                              <div className="text-white/40 font-medium">FOLLOWERS</div>
                              <div className="font-bold text-white text-xs">
                                {playlist.followerCount >= 1000
                                  ? `${(playlist.followerCount / 1000).toFixed(1)}k`
                                  : playlist.followerCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-white/40 font-medium">APPROVAL</div>
                              <div className="font-bold text-emerald-400 text-xs">
                                {playlist.approvalRate}%
                              </div>
                            </div>
                            <div>
                              <div className="text-white/40 font-medium">RESPONDS</div>
                              <div className="font-bold text-amber-300 text-xs">
                                ~{playlist.avgResponseHours}h
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-white/60 mt-3 line-clamp-2 leading-relaxed font-sans">
                        {playlist.description}
                      </p>

                      {/* Genre Badges */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {playlist.genres.map(genre => (
                          <span
                            key={genre}
                            className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-sans text-white/70 border border-white/10"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {playlist.freePitchEnabled ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-sans font-bold border border-emerald-500/30">
                            FREE PITCH
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-sans font-bold border border-amber-500/30">
                            PREMIUM ONLY
                          </span>
                        )}
                        <span className="text-xs font-sans text-white/50">
                          {playlist.pitchCostCredits} Credit{playlist.pitchCostCredits > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={playlist.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-surface border border-white/10 text-white/60 hover:text-white hover:border-spotify-green/50 transition-colors"
                          title="Open in Spotify"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openPitchModal(playlist)}
                          className="px-4 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-spotify-green/20 cursor-pointer transition-colors text-xs font-display"
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
