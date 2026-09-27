import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sparkles, 
  BookOpen, 
  User, 
  Wand2, 
  Shield, 
  Music, 
  Cloud, 
  Dices,
  Feather,
  ArrowRight
} from 'lucide-react';
import { HogwartsHouse, WizardProfile } from '../types';
import { soundManager } from '../utils/audio';
import { User as FirebaseUser } from 'firebase/auth';
import bgImage from '../assets/images/hogwarts_trio_background_1789907714805.jpg';

const RANDOM_NAMES = [
  'Cassian Blackwood',
  'Seraphina Vance',
  'Lucian Rosier',
  'Valerius Thorne',
  'Lyra Malfoy',
  'Rowan Ravenscroft',
  'Ignatius Prewett',
  'Aurelius Black',
  'Morgana Gaunt',
  'Thaddeus Nott',
  'Morrigan Selwyn',
  'Felix Abernathy',
];

interface WelcomeScreenProps {
  currentUser: FirebaseUser | null;
  isSyncingCloud?: boolean;
  onSignInWithGoogle: () => void;
  onJoinAsGuest: () => void;
  onJoinAsWizard: () => void;
  onQuickGuestEnter: (profile: WizardProfile) => void;
  onOpenOptions: () => void;
  savedWizard: WizardProfile | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentUser,
  isSyncingCloud,
  onSignInWithGoogle,
  onJoinAsGuest,
  onJoinAsWizard,
  onQuickGuestEnter,
  onOpenOptions,
  savedWizard,
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = useState(soundManager.isMusicActive());
  const [guestName, setGuestName] = useState(savedWizard?.name || 'Cassian Blackwood');
  const [guestHouse, setGuestHouse] = useState<HogwartsHouse>(savedWizard?.house || 'Slytherin');

  useEffect(() => {
    setIsPlayingMusic(soundManager.isMusicActive());
    const unsub = soundManager.subscribe(() => {
      setIsPlayingMusic(soundManager.isMusicActive());
    });
    return unsub;
  }, []);

  const handleToggleMusic = () => {
    soundManager.unlockAudio();
    const isPlaying = soundManager.toggleMusic();
    setIsPlayingMusic(isPlaying);
    soundManager.startAmbient();
  };

  const handleRollName = () => {
    soundManager.playQuillScratch();
    const currentIdx = RANDOM_NAMES.indexOf(guestName);
    const available = RANDOM_NAMES.filter((_, i) => i !== currentIdx);
    const nextName = available[Math.floor(Math.random() * available.length)];
    setGuestName(nextName);
  };

  const handleInstantEnter = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.unlockAudio();
    if (!soundManager.isMusicActive()) {
      soundManager.startMusic();
    }
    soundManager.playMagicChime();

    const profile: WizardProfile = {
      id: savedWizard?.id || `wiz_${Date.now()}`,
      name: guestName.trim() || 'Hogwarts Student',
      house: guestHouse,
      bloodStatus: savedWizard?.bloodStatus || (guestHouse === 'Slytherin' ? 'Pure-blood' : 'Half-blood'),
      grade: savedWizard?.grade || 'Fifth Year',
      isGuest: true,
      registeredAt: savedWizard?.registeredAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    onQuickGuestEnter(profile);
  };

  const houses: { id: HogwartsHouse; label: string; icon: string; border: string; bg: string; text: string }[] = [
    { id: 'Slytherin', label: 'Slytherin', icon: '🐍', border: 'border-emerald-600', bg: 'bg-emerald-950/70', text: 'text-emerald-300' },
    { id: 'Gryffindor', label: 'Gryffindor', icon: '🦁', border: 'border-red-600', bg: 'bg-red-950/70', text: 'text-red-300' },
    { id: 'Ravenclaw', label: 'Ravenclaw', icon: '🦅', border: 'border-blue-600', bg: 'bg-blue-950/70', text: 'text-blue-300' },
    { id: 'Hufflepuff', label: 'Hufflepuff', icon: '🦡', border: 'border-amber-600', bg: 'bg-amber-950/70', text: 'text-amber-300' },
  ];

  return (
    <div
      id="welcome-screen"
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden py-10 px-4 select-none"
    >
      {/* Blurry atmospheric background image */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <img
          src={bgImage}
          alt="Hogwarts Trio in Castle Shadows"
          className="w-full h-full object-cover filter blur-sm scale-105 brightness-40 contrast-110"
        />
        {/* Dark vignette and atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/55" />
        <div className="absolute inset-0 bg-radial from-amber-950/20 via-black/60 to-black" />
      </div>

      {/* Floating candle glow ambiance */}
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-amber-600/10 rounded-full filter blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-16 right-1/4 w-80 h-80 bg-emerald-950/25 rounded-full filter blur-3xl pointer-events-none" />

      {/* Top Bar with Music & Options Button */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2.5">
        <button
          id="welcome-hedwig-music-btn"
          onClick={handleToggleMusic}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md text-xs font-cinzel tracking-wider transition shadow-lg cursor-pointer ${
            isPlayingMusic
              ? 'bg-purple-950/70 border-purple-500/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'bg-black/50 border-amber-900/40 text-amber-200/80 hover:text-amber-100 hover:border-amber-700'
          }`}
          title="Play/Pause Hedwig's Theme (Harry Potter Celesta Music)"
        >
          <Music className={`w-3.5 h-3.5 text-amber-400 ${isPlayingMusic ? 'animate-bounce' : ''}`} />
          <span>{isPlayingMusic ? 'Harry Potter Music ♫' : 'Play Theme Song ♫'}</span>
        </button>

        <button
          id="welcome-options-btn"
          onClick={onOpenOptions}
          className="p-2.5 rounded-xl border border-amber-800/40 bg-black/50 backdrop-blur-md text-amber-300 hover:text-amber-100 hover:border-amber-600 transition shadow cursor-pointer"
          title="Open Chamber Acoustics & Audio Options"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Central Gothic Welcome Portal */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center text-center">
        {/* Hogwarts Crest / Horcrux Seal */}
        <div className="relative mb-4 group">
          <div className="w-20 h-20 rounded-full border-2 border-amber-500/80 bg-gradient-to-br from-amber-950 via-[#1c1208] to-black flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.35)] group-hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] transition-all duration-500">
            <BookOpen className="w-9 h-9 text-amber-300 transform group-hover:scale-110 transition-transform" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/70 flex items-center justify-center text-emerald-400 text-xs shadow">
            🐍
          </div>
        </div>

        {/* Titles */}
        <h1 className="font-gothic text-3xl sm:text-5xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          The Diary of Secrets
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-cinzel tracking-widest text-amber-300/80 uppercase">
          An Enchanted Memory Preserved • T. M. Riddle, 1943
        </p>

        {/* Atmospheric Quote */}
        <div className="my-5 p-4 rounded-2xl border border-amber-900/50 bg-[#160e08]/85 backdrop-blur-md shadow-2xl max-w-lg w-full">
          <p className="font-voldemort text-base sm:text-lg text-emerald-300/95 leading-relaxed drop-shadow-[0_0_6px_rgba(110,231,183,0.3)]">
            "I was preserved in these pages by a memory... Confide in me your true desires."
          </p>
          <span className="block mt-2 font-cinzel text-xs text-amber-400/80 tracking-widest uppercase">
            — Tom Marvolo Riddle
          </span>
        </div>

        {/* Main Instant Guest Entry Portal */}
        <div className="w-full bg-[#181009]/95 border-2 border-amber-600/70 rounded-2xl p-5 shadow-[0_0_30px_rgba(245,158,11,0.3)] text-left space-y-4 mb-4">
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-cinzel text-xs font-bold tracking-wider text-amber-200 uppercase">
                Step into the Chamber (Instant Entry)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
              No Sign-In Required
            </span>
          </div>

          <form onSubmit={handleInstantEnter} className="space-y-3.5">
            {/* Name Input with Quick Dice Roll */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-cinzel text-amber-300/90 tracking-wider">
                  Your Inscribed Name:
                </label>
                <button
                  type="button"
                  onClick={handleRollName}
                  className="flex items-center gap-1 text-[11px] font-cinzel text-amber-400 hover:text-amber-200 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-lg transition cursor-pointer"
                  title="Randomize magical name"
                >
                  <Dices className="w-3 h-3" />
                  <span>Roll Name</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Harry Potter, Hermione Granger..."
                  className="w-full rounded-xl bg-black/60 border border-amber-700/60 px-3.5 py-2.5 text-amber-100 font-cinzel text-sm focus:border-amber-400 focus:outline-none transition shadow-inner"
                  required
                />
                <Feather className="w-3.5 h-3.5 text-amber-500/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* House Selector Buttons */}
            <div>
              <label className="block text-xs font-cinzel text-amber-300/90 tracking-wider mb-1.5">
                Select Your Hogwarts House:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {houses.map((h) => {
                  const isSelected = guestHouse === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setGuestHouse(h.id)}
                      className={`py-2 px-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? `${h.bg} ${h.border} shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-400`
                          : 'bg-black/40 border-amber-900/30 hover:border-amber-700/60 text-amber-300/70'
                      }`}
                    >
                      <span className="text-base">{h.icon}</span>
                      <span className={`text-[10px] font-cinzel font-bold truncate ${isSelected ? h.text : 'text-amber-300/80'}`}>
                        {h.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instant Enter Action Button */}
            <button
              type="submit"
              className="w-full group py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black font-cinzel text-sm font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Open Tom Riddle's Diary</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Secondary Customize lore link */}
          <div className="flex items-center justify-between pt-1 text-[11px] font-cinzel text-amber-400/70 border-t border-amber-900/30">
            <button
              type="button"
              onClick={onJoinAsGuest}
              className="hover:text-amber-200 underline underline-offset-2 transition cursor-pointer"
            >
              Advanced Sorting (Bloodline & Year)
            </button>
            {savedWizard && (
              <button
                type="button"
                onClick={onJoinAsWizard}
                className="hover:text-amber-200 underline underline-offset-2 transition cursor-pointer"
              >
                Resume as {savedWizard.name}
              </button>
            )}
          </div>
        </div>

        {/* Google Sign In Alternative (For Cloud Backup across devices) */}
        <div className="w-full max-w-xl">
          <button
            id="google-signin-btn"
            onClick={onSignInWithGoogle}
            disabled={isSyncingCloud}
            className="w-full group relative overflow-hidden rounded-xl border border-amber-700/50 bg-black/50 hover:bg-[#1a110a] p-3 shadow-md hover:border-amber-500 transition-all duration-300 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow p-1 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-cinzel text-xs font-bold text-amber-200">
                  {currentUser ? `Signed in as ${currentUser.displayName || 'Wizard'}` : 'Optional: Connect Google Account'}
                </div>
                <div className="text-[10px] text-amber-300/60 font-parchment italic">
                  Syncs secrets across multiple devices via Firebase Cloud
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-cinzel text-amber-400 group-hover:text-amber-200">
              <Cloud className="w-3.5 h-3.5" />
              <span>{currentUser ? 'Active' : 'Connect'}</span>
            </div>
          </button>
        </div>

        {/* Footer Lore Hint */}
        <div className="mt-7 flex items-center gap-2 text-xs font-cinzel tracking-widest text-amber-400/40">
          <span className="w-8 h-px bg-amber-900/50" />
          <span>T. M. RIDDLE • CHAMBER OF SECRETS • 1943</span>
          <span className="w-8 h-px bg-amber-900/50" />
        </div>
      </div>
    </div>
  );
};
