import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Music, 
  Wind, 
  Database, 
  RotateCcw, 
  X, 
  ShieldCheck, 
  Play, 
  Pause,
  CloudLightning,
  Library,
  Flame
} from 'lucide-react';
import { AmbientTrack, SoundSettings } from '../types';
import { soundManager } from '../utils/audio';

interface OptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  soundSettings: SoundSettings;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
  quillCursorEnabled: boolean;
  onToggleQuillCursor: (val: boolean) => void;
  onResetSecrets: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  isOpen,
  onClose,
  soundSettings,
  onUpdateSoundSettings,
  quillCursorEnabled,
  onToggleQuillCursor,
  onResetSecrets,
}) => {
  const [isHedwigPlaying, setIsHedwigPlaying] = useState(soundSettings.hedwigsThemeEnabled);

  useEffect(() => {
    setIsHedwigPlaying(soundManager.isHedwigsThemePlaying());
  }, [isOpen]);

  if (!isOpen) return null;

  // Master Sound Toggle
  const handleToggleMasterSound = () => {
    const updated = !soundSettings.soundEnabled;
    soundManager.setEnabled(updated);
    const newSettings = { ...soundSettings, soundEnabled: updated };
    onUpdateSoundSettings(newSettings);
    if (updated) {
      soundManager.playMagicChime();
      if (soundSettings.ambientEnabled) soundManager.startAmbient();
      if (soundSettings.hedwigsThemeEnabled) soundManager.startHedwigsTheme();
    }
  };

  // Master Volume
  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    soundManager.setMasterVolume(vol);
    onUpdateSoundSettings({ ...soundSettings, volume: vol });
  };

  // Hedwig's Theme Music Toggle
  const handleToggleHedwig = () => {
    const nextState = !soundSettings.hedwigsThemeEnabled;
    if (nextState) {
      soundManager.startHedwigsTheme();
      setIsHedwigPlaying(true);
    } else {
      soundManager.stopHedwigsTheme();
      setIsHedwigPlaying(false);
    }
    onUpdateSoundSettings({ ...soundSettings, hedwigsThemeEnabled: nextState });
  };

  // Hedwig's Theme Volume
  const handleHedwigVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    soundManager.setHedwigsVolume(vol);
    onUpdateSoundSettings({ ...soundSettings, hedwigsThemeVolume: vol });
  };

  // Ambient Soundscape Toggle
  const handleToggleAmbient = () => {
    const nextState = !soundSettings.ambientEnabled;
    if (nextState) {
      soundManager.startAmbient();
    } else {
      soundManager.stopAmbient();
    }
    onUpdateSoundSettings({ ...soundSettings, ambientEnabled: nextState });
  };

  // Ambient Track Selector
  const handleSelectAmbientTrack = (track: AmbientTrack) => {
    soundManager.setAmbientTrack(track);
    onUpdateSoundSettings({ ...soundSettings, ambientTrack: track });
    soundManager.playMagicChime();
  };

  // Ambient Volume
  const handleAmbientVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    soundManager.setAmbientVolume(vol);
    onUpdateSoundSettings({ ...soundSettings, ambientVolume: vol });
  };

  // SFX Toggle
  const handleToggleSfx = () => {
    const nextState = !soundSettings.sfxEnabled;
    onUpdateSoundSettings({ ...soundSettings, sfxEnabled: nextState });
    if (nextState) soundManager.playQuillScratch();
  };

  // SFX Volume
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    soundManager.setSfxVolume(vol);
    onUpdateSoundSettings({ ...soundSettings, sfxVolume: vol });
  };

  const ambientTracks: { id: AmbientTrack; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'restricted-section',
      label: 'Restricted Library',
      icon: <Library className="w-4 h-4 text-amber-400" />,
      desc: 'Haunting resonant bass & warm candle hum',
    },
    {
      id: 'astronomy-thunder',
      label: 'Astronomy Thunder',
      icon: <CloudLightning className="w-4 h-4 text-blue-400" />,
      desc: 'Raindrops & distant castle thunder rumbles',
    },
    {
      id: 'chamber-whispers',
      label: 'Chamber of Secrets',
      icon: <Flame className="w-4 h-4 text-emerald-400" />,
      desc: 'Subterranean echoes & cold resonant hollows',
    },
  ];

  return (
    <div
      id="options-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="options-modal-dialog"
        className="w-full max-w-lg rounded-3xl border border-amber-900/50 bg-gradient-to-b from-[#1c1511] via-[#120d0a] to-[#0a0705] p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-amber-100/90 relative my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-700/50 text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-gothic text-xl font-bold tracking-wider text-amber-200">
                Chamber Acoustics & Enchantments
              </h3>
              <p className="text-xs text-amber-300/60 font-parchment italic">
                Control Hedwig's Theme, castle ambient soundscapes & quill magic
              </p>
            </div>
          </div>
          <button
            id="close-options-btn"
            onClick={onClose}
            className="rounded-xl p-2 text-amber-200/60 hover:text-amber-200 hover:bg-amber-900/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Body */}
        <div className="space-y-5 pt-4">
          {/* SECTION 1: MASTER VOLUME & SOUND TOGGLE */}
          <div className="rounded-2xl bg-black/40 border border-amber-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundSettings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-neutral-500" />
                )}
                <div>
                  <div className="text-sm font-cinzel font-bold text-amber-200">
                    Master Sound Engine
                  </div>
                  <div className="text-xs text-amber-200/60 font-parchment">
                    Global acoustics for music, ambiance & echoes
                  </div>
                </div>
              </div>
              <button
                id="toggle-master-sound-btn"
                type="button"
                onClick={handleToggleMasterSound}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  soundSettings.soundEnabled ? 'bg-amber-600' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {soundSettings.soundEnabled && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-amber-300/80 font-cinzel">
                  <span>Master Volume</span>
                  <span>{Math.round(soundSettings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundSettings.volume}
                  onChange={handleMasterVolumeChange}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}
          </div>

          {/* SECTION 2: HEDWIG'S THEME (HARRY POTTER MUSIC) */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/20 to-black/50 border border-amber-700/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-950/70 border border-purple-600/40 flex items-center justify-center text-purple-300 shadow">
                  <Music className={`w-4 h-4 ${soundSettings.hedwigsThemeEnabled ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="text-sm font-cinzel font-bold text-amber-100 flex items-center gap-2">
                    <span>Hedwig's Theme (Harry Potter Music)</span>
                    {soundSettings.hedwigsThemeEnabled && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-xs text-amber-300/60 font-parchment">
                    Magical celesta bell synthesizer melody
                  </div>
                </div>
              </div>
              <button
                id="toggle-hedwig-theme-btn"
                type="button"
                onClick={handleToggleHedwig}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-cinzel font-bold transition-all cursor-pointer ${
                  soundSettings.hedwigsThemeEnabled
                    ? 'border-purple-500 bg-purple-900/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'border-amber-900/40 bg-black/40 text-amber-300/60 hover:text-amber-200'
                }`}
              >
                {soundSettings.hedwigsThemeEnabled ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Playing</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Play Song</span>
                  </>
                )}
              </button>
            </div>

            {soundSettings.hedwigsThemeEnabled && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-purple-300/80 font-cinzel">
                  <span>Celesta Volume</span>
                  <span>{Math.round(soundSettings.hedwigsThemeVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundSettings.hedwigsThemeVolume}
                  onChange={handleHedwigVolumeChange}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            )}
          </div>

          {/* SECTION 3: CASTLE AMBIENT ATMOSPHERE */}
          <div className="rounded-2xl bg-black/40 border border-amber-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wind className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-sm font-cinzel font-bold text-amber-200">
                    Atmospheric Soundscapes
                  </div>
                  <div className="text-xs text-amber-200/60 font-parchment">
                    Choose your background castle resonance
                  </div>
                </div>
              </div>
              <button
                id="toggle-ambient-btn"
                type="button"
                onClick={handleToggleAmbient}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  soundSettings.ambientEnabled ? 'bg-amber-600' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundSettings.ambientEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {soundSettings.ambientEnabled && (
              <div className="space-y-3 pt-1">
                {/* Track Selector Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ambientTracks.map((trk) => {
                    const isSelected = soundSettings.ambientTrack === trk.id;
                    return (
                      <button
                        key={trk.id}
                        type="button"
                        onClick={() => handleSelectAmbientTrack(trk.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-950/60 shadow-[0_0_12px_rgba(217,119,6,0.3)]'
                            : 'border-amber-900/30 bg-black/30 hover:bg-amber-950/30 text-amber-200/70'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-cinzel text-xs font-bold text-amber-100 mb-1">
                          {trk.icon}
                          <span className="truncate">{trk.label}</span>
                        </div>
                        <p className="text-[10px] font-parchment italic text-amber-300/60 leading-tight">
                          {trk.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-amber-300/80 font-cinzel">
                    <span>Ambiance Volume</span>
                    <span>{Math.round(soundSettings.ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundSettings.ambientVolume}
                    onChange={handleAmbientVolumeChange}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: QUILL SFX & ENCHANTED CURSOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quill SFX */}
            <div className="rounded-2xl bg-black/40 border border-amber-900/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-amber-200">
                  Quill Scratch & SFX
                </span>
                <button
                  type="button"
                  onClick={handleToggleSfx}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    soundSettings.sfxEnabled ? 'bg-amber-600' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      soundSettings.sfxEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundSettings.sfxVolume}
                  onChange={handleSfxVolumeChange}
                  className="w-28 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <button
                  type="button"
                  onClick={() => soundManager.playQuillScratch()}
                  className="px-2 py-0.5 rounded bg-amber-900/40 text-[10px] font-cinzel text-amber-300 hover:bg-amber-800 cursor-pointer"
                >
                  Test Scratch
                </button>
              </div>
            </div>

            {/* Feather Quill Cursor */}
            <div className="rounded-2xl bg-black/40 border border-amber-900/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-amber-200">
                  Enchanted Quill Cursor
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onToggleQuillCursor(!quillCursorEnabled);
                    soundManager.playMagicChime();
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    quillCursorEnabled ? 'bg-amber-600' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      quillCursorEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] font-parchment italic text-amber-300/50">
                Feather nib leaving glowing ink droplets on movement
              </p>
            </div>
          </div>

          {/* SECTION 5: FIREBASE STORAGE & RESET */}
          <div className="rounded-2xl bg-amber-950/20 border border-amber-800/30 p-3.5">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-cinzel mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Secrets Vault</span>
            </div>
            <p className="text-[11px] text-amber-200/70 font-parchment leading-relaxed">
              Every confession and shadowy response is cryptographically sealed in your wizard archive.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>Synchronized & Preserved</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-amber-900/30 flex justify-between items-center">
            <button
              id="reset-secrets-btn"
              type="button"
              onClick={() => {
                if (window.confirm("Wipe all recorded secrets and begin as an unknown guest once more?")) {
                  onResetSecrets();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-300 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Burn Diary Pages</span>
            </button>
            <button
              id="confirm-options-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 text-xs font-cinzel tracking-wider transition cursor-pointer font-bold shadow"
            >
              Close Chamber Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
