import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ListMusic, Plus, Sparkles, CheckCircle2, ShieldCheck, Radio } from 'lucide-react';
import { DEMO_TRACKS } from '../../data/mockData';

export const OnboardPlaylistModal: React.FC = () => {
  const {
    onboardPlaylistModalOpen,
    setOnboardPlaylistModalOpen,
    addPlaylist,
    currentUser
  } = useApp();

  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverArt, setCoverArt] = useState('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80');
  const [followerCount, setFollowerCount] = useState<number>(34200);
  const [trackCount, setTrackCount] = useState<number>(85);
  const [genres, setGenres] = useState<string>('Melodic Techno, Deep House');
  const [pitchCost, setPitchCost] = useState<number>(1);
  const [freePitchEnabled, setFreePitchEnabled] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!onboardPlaylistModalOpen) return null;

  const handleUrlChange = (val: string) => {
    setSpotifyUrl(val);
    if (val.includes('spotify.com/playlist/')) {
      // Mock automatic metadata extraction
      setTitle('Sane Low Club Selections 2026');
      setDescription('Fresh underground melodic club tracks and driving peak-time tech house.');
      setFollowerCount(48500);
      setTrackCount(92);
      setCoverArt('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    const parsedGenres = genres.split(',').map(g => g.trim()).filter(Boolean);

    addPlaylist({
      title,
      description: description || 'Curated high-energy playlist with weekly updates.',
      coverArt,
      spotifyUrl: spotifyUrl || 'https://open.spotify.com/playlist/37i9dQZF1DXa2PvU94hUud',
      spotifyUri: `spotify:playlist:${Date.now()}`,
      followerCount: Number(followerCount) || 12000,
      trackCount: Number(trackCount) || 50,
      genres: parsedGenres.length > 0 ? parsedGenres : ['Deep House', 'Melodic Techno'],
      pitchCostCredits: pitchCost,
      freePitchEnabled,
      spotlightTrack: DEMO_TRACKS[0],
      isFeatured: false,
      acceptingSubmissions: true
    });

    setIsSubmitting(false);
    setOnboardPlaylistModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card-sane w-full max-w-xl rounded-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3a3a3a] flex items-center justify-between bg-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#BE1E2F] flex items-center justify-center text-white">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-title text-white">CONNECT SPOTIFY PLAYLIST</h3>
              <div className="text-[11px] font-mono-code text-white/50">
                Onboard your playlist to receive pitch submissions
              </div>
            </div>
          </div>

          <button
            onClick={() => setOnboardPlaylistModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] text-white/60 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-mono-code text-white/80 block mb-1">
              Spotify Playlist Link or URI:
            </label>
            <input
              type="text"
              required
              value={spotifyUrl}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="https://open.spotify.com/playlist/37i9dQZF1DXa2PvU94hUud"
              className="w-full bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-xl border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono-code text-white/80 block mb-1">
                Playlist Title:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Melodic Club Sessions"
                className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code text-white/80 block mb-1">
                Genres (comma-separated):
              </label>
              <input
                type="text"
                value={genres}
                onChange={e => setGenres(e.target.value)}
                placeholder="Deep House, Techno, Pop"
                className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono-code text-white/80 block mb-1">
                Estimated Followers:
              </label>
              <input
                type="number"
                value={followerCount}
                onChange={e => setFollowerCount(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code text-white/80 block mb-1">
                Pitch Cost (Credits):
              </label>
              <select
                value={pitchCost}
                onChange={e => setPitchCost(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
              >
                <option value={1}>1 Credit (Standard)</option>
                <option value={2}>2 Credits (High Demand)</option>
                <option value={3}>3 Credits (Top 100k+ Tier)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono-code text-white/80 block mb-1">
              Description / Vibe Guidelines:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Explain the sound profile, tempos, and release criteria..."
              className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-xl border border-[#3a3a3a] text-xs font-mono-code focus:outline-none focus:border-[#BE1E2F]"
            />
          </div>

          {/* Free pitch toggle */}
          <div className="card-panel p-3.5 rounded-xl border border-[#3a3a3a] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold font-title text-white">
                ALLOW FREE SPOTLIGHT PITCHES
              </div>
              <div className="text-[10px] text-white/60 font-mono-code">
                Artists must stream 30 seconds of your spotlight song before submitting.
              </div>
            </div>
            <input
              type="checkbox"
              checked={freePitchEnabled}
              onChange={e => setFreePitchEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#BE1E2F]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOnboardPlaylistModalOpen(false)}
              className="text-xs font-mono-code text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-sane text-xs px-6 py-2.5 rounded-xl font-bold font-title flex items-center gap-2 cursor-pointer shadow-lg shadow-[#BE1E2F]/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save & Open Submission Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
