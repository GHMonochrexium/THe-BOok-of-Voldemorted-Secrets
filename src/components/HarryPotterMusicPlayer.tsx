import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Music, 
  Disc, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
import { HarryPotterTrack, MusicInstrumentStyle } from '../types';
import { soundManager, HARRY_POTTER_TRACKS } from '../utils/audio';

interface HarryPotterMusicPlayerProps {
  onOpenOptions?: () => void;
}

export const HarryPotterMusicPlayer: React.FC<HarryPotterMusicPlayerProps> = ({ onOpenOptions }) => {
  const [isPlaying, setIsPlaying] = useState(soundManager.isMusicActive());
  const [currentTrack, setCurrentTrack] = useState<HarryPotterTrack>(soundManager.getCurrentTrack());
  const [volume, setVolume] = useState(soundManager.getMusicVolume());
  const [instrumentStyle, setInstrumentStyle] = useState<MusicInstrumentStyle>(soundManager.getInstrumentStyle());
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [noteFreq, setNoteFreq] = useState(0);

  // Sync state with SoundManager subscriptions
  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setIsPlaying(soundManager.isMusicActive());
      setCurrentTrack(soundManager.getCurrentTrack());
      setVolume(soundManager.getMusicVolume());
      setInstrumentStyle(soundManager.getInstrumentStyle());
      setNoteFreq(soundManager.getCurrentNoteFreq());
    });
    return unsubscribe;
  }, []);

  const handleTogglePlay = () => {
    soundManager.unlockAudio();
    const nextState = soundManager.toggleMusic();
    setIsPlaying(nextState);
    if (nextState) {
      soundManager.startAmbient();
    }
  };

  const handleNextTrack = () => {
    soundManager.unlockAudio();
    soundManager.nextTrack();
  };

  const handlePrevTrack = () => {
    soundManager.unlockAudio();
    soundManager.prevTrack();
  };

  const handleSelectTrack = (trackId: HarryPotterTrack) => {
    soundManager.unlockAudio();
    soundManager.setTrack(trackId);
    if (!isPlaying) {
      soundManager.startMusic(trackId);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundManager.setMusicVolume(val);
  };

  const handleSelectStyle = (style: MusicInstrumentStyle) => {
    soundManager.setInstrumentStyle(style);
    setShowStyleMenu(false);
  };

  const trackInfo = HARRY_POTTER_TRACKS[currentTrack] || HARRY_POTTER_TRACKS['hedwigs-theme'];

  return (
    <aside
      id="harry-potter-music-player"
      aria-label="Harry Potter Soundtrack Music Player"
      className="fixed bottom-4 right-4 z-40 select-none transition-all duration-300 max-w-[calc(100vw-2rem)]"
    >
      {/* Minimized Floating Pill Button */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.8)] transition-all cursor-pointer group ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-950/90 to-purple-950/90 border-amber-500/60 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse-subtle'
              : 'bg-black/85 border-amber-900/50 text-amber-300/80 hover:border-amber-600 hover:text-amber-100'
          }`}
          title="Expand Harry Potter Music Player"
        >
          <div className="relative">
            <Disc className={`w-4 h-4 text-amber-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="font-cinzel text-xs font-semibold tracking-wider">
            {isPlaying ? trackInfo.title : "Harry Potter Music ♫"}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-amber-400/80 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      ) : (
        /* Full Expanded Player Card */
        <div className="w-80 sm:w-88 rounded-2xl border border-amber-700/50 bg-gradient-to-b from-[#1c1511]/95 via-[#130d0a]/95 to-black/95 p-3.5 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl text-amber-100 relative overflow-hidden">
          {/* Subtle magical aura background */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full filter blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-purple-600/10 rounded-full filter blur-2xl pointer-events-none" />

          {/* Header row: badge & minimize */}
          <div className="flex items-center justify-between pb-2.5 border-b border-amber-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-950/80 border border-amber-700/40 text-amber-400">
                <Music className="w-3 h-3" />
              </span>
              <span className="text-[11px] font-cinzel font-bold tracking-widest text-amber-200/90 uppercase">
                Hogwarts Soundtrack
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  showStyleMenu
                    ? 'bg-amber-900/40 border-amber-600 text-amber-200'
                    : 'bg-black/40 border-amber-900/30 text-amber-300/60 hover:text-amber-200 hover:border-amber-700'
                }`}
                title="Instrument Tone Options"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg bg-black/40 border border-amber-900/30 text-amber-300/60 hover:text-amber-200 hover:border-amber-700 transition cursor-pointer"
                title="Minimize player"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Instrument Style Sub-menu dropdown */}
          {showStyleMenu && (
            <div className="mt-2.5 p-2 rounded-xl bg-black/80 border border-amber-800/40 space-y-1 text-xs font-cinzel">
              <div className="text-[10px] text-amber-300/60 uppercase tracking-wider px-2 py-0.5">
                Instrument Timbre
              </div>
              <button
                onClick={() => handleSelectStyle('celesta-strings')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition ${
                  instrumentStyle === 'celesta-strings'
                    ? 'bg-amber-900/40 text-amber-200 font-semibold'
                    : 'text-amber-300/70 hover:bg-amber-950/30 hover:text-amber-100'
                }`}
              >
                <span>Celesta & String Pads</span>
                {instrumentStyle === 'celesta-strings' && <Check className="w-3 h-3 text-amber-400" />}
              </button>
              <button
                onClick={() => handleSelectStyle('music-box')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition ${
                  instrumentStyle === 'music-box'
                    ? 'bg-amber-900/40 text-amber-200 font-semibold'
                    : 'text-amber-300/70 hover:bg-amber-950/30 hover:text-amber-100'
                }`}
              >
                <span>Enchanted Music Box</span>
                {instrumentStyle === 'music-box' && <Check className="w-3 h-3 text-amber-400" />}
              </button>
              <button
                onClick={() => handleSelectStyle('harp-bells')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition ${
                  instrumentStyle === 'harp-bells'
                    ? 'bg-amber-900/40 text-amber-200 font-semibold'
                    : 'text-amber-300/70 hover:bg-amber-950/30 hover:text-amber-100'
                }`}
              >
                <span>Harp Plucks & Chimes</span>
                {instrumentStyle === 'harp-bells' && <Check className="w-3 h-3 text-amber-400" />}
              </button>
            </div>
          )}

          {/* Current Playing Track Info */}
          <div className="py-3 flex items-center gap-3">
            {/* Spinning Vinyl Record Badge */}
            <div className="relative shrink-0">
              <div
                className={`w-12 h-12 rounded-full border-2 border-amber-600/50 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center shadow-lg transition-transform ${
                  isPlaying ? 'shadow-[0_0_15px_rgba(245,158,11,0.4)]' : ''
                }`}
              >
                <Disc
                  className={`w-7 h-7 text-amber-400/80 ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '3.5s' }}
                />
              </div>
              {isPlaying && (
                <Sparkles className="w-3 h-3 text-amber-300 absolute -top-0.5 -right-0.5 animate-pulse" />
              )}
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-gothic text-base text-amber-100 truncate font-bold tracking-wide">
                  {trackInfo.title}
                </h4>
              </div>
              <p className="text-[11px] font-cinzel text-amber-300/60 truncate">
                {trackInfo.composer} • {trackInfo.signature}
              </p>

              {/* Magical audio visualizer frequency bars */}
              <div className="flex items-end gap-1 mt-1.5 h-3">
                {[40, 75, 55, 90, 65, 80, 45, 95].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isPlaying
                        ? 'bg-gradient-to-t from-amber-600 to-amber-300 animate-pulse'
                        : 'bg-neutral-800'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 1 : 0.8)))}%` : '20%',
                      animationDelay: `${i * 90}ms`,
                      animationDuration: '600ms',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Primary Playback Controls */}
          <div className="flex items-center justify-between gap-3 pt-1 pb-2">
            <button
              onClick={handlePrevTrack}
              className="p-2 rounded-xl bg-black/40 border border-amber-900/30 text-amber-300/70 hover:text-amber-100 hover:border-amber-700 transition cursor-pointer"
              title="Previous Harry Potter Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Big Main Play/Pause Button */}
            <button
              id="music-player-main-play-btn"
              onClick={handleTogglePlay}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border font-cinzel text-xs font-bold tracking-wider transition-all duration-300 cursor-pointer shadow-lg ${
                isPlaying
                  ? 'bg-gradient-to-r from-purple-900/80 via-amber-900/70 to-purple-900/80 border-amber-500/70 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                  : 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 border-amber-400 text-black hover:brightness-110 shadow-[0_0_25px_rgba(217,119,6,0.5)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Music</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Harry Potter Theme</span>
                </>
              )}
            </button>

            <button
              onClick={handleNextTrack}
              className="p-2 rounded-xl bg-black/40 border border-amber-900/30 text-amber-300/70 hover:text-amber-100 hover:border-amber-700 transition cursor-pointer"
              title="Next Harry Potter Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Track Selection Pills */}
          <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-amber-900/30">
            {(['hedwigs-theme', 'leaving-hogwarts', 'chamber-of-secrets'] as HarryPotterTrack[]).map((tId) => {
              const info = HARRY_POTTER_TRACKS[tId];
              const isSelected = currentTrack === tId;
              return (
                <button
                  key={tId}
                  onClick={() => handleSelectTrack(tId)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-cinzel tracking-wider text-center truncate transition cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.3)] font-semibold'
                      : 'bg-black/30 border-amber-900/20 text-amber-300/60 hover:text-amber-200 hover:border-amber-800'
                  }`}
                  title={info.description}
                >
                  {tId === 'hedwigs-theme' ? "Hedwig's Theme" : tId === 'leaving-hogwarts' ? "Leaving Hogwarts" : "Chamber Mystery"}
                </button>
              );
            })}
          </div>

          {/* Volume Slider row */}
          <div className="flex items-center gap-2 pt-2.5 mt-1 border-t border-amber-900/20 text-xs text-amber-300/70">
            {volume > 0 ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              title="Music Volume"
            />
            <span className="text-[10px] font-cinzel w-8 text-right font-mono">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
