import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, BookOpen, User, Wand2, Shield, Music, Pause, Play } from 'lucide-react';
import { WizardProfile } from '../types';
import { soundManager } from '../utils/audio';
import bgImage from '../assets/images/hogwarts_trio_background_1789907714805.jpg';

interface WelcomeScreenProps {
  onJoinAsGuest: () => void;
  onJoinAsWizard: () => void;
  onOpenOptions: () => void;
  savedWizard: WizardProfile | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onJoinAsGuest,
  onJoinAsWizard,
  onOpenOptions,
  savedWizard,
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = useState(soundManager.isHedwigsThemePlaying());

  useEffect(() => {
    setIsPlayingMusic(soundManager.isHedwigsThemePlaying());
  }, []);

  const handleToggleMusic = () => {
    const isPlaying = soundManager.toggleHedwigsTheme();
    setIsPlayingMusic(isPlaying);
    soundManager.startAmbient();
  };

  const handleGuestClick = () => {
    soundManager.playPageTurn();
    onJoinAsGuest();
  };

  const handleWizardClick = () => {
    soundManager.playPageTurn();
    onJoinAsWizard();
  };

  return (
    <div
      id="welcome-screen"
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 select-none"
    >
      {/* Blurry atmospheric background image of Harry Potter and friends in Hogwarts */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <img
          src={bgImage}
          alt="Hogwarts Trio in Castle Shadows"
          className="w-full h-full object-cover filter blur-sm scale-105 brightness-40 contrast-110"
        />
        {/* Dark vignette and atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />
        <div className="absolute inset-0 bg-radial from-amber-950/20 via-black/60 to-black" />
      </div>

      {/* Floating candle glow ambiance */}
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-amber-600/10 rounded-full filter blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-16 right-1/4 w-80 h-80 bg-emerald-950/25 rounded-full filter blur-3xl pointer-events-none" />

      {/* Top Bar with Music & Options Button */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2.5">
        {/* Quick Hedwig's Theme Music Toggle */}
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

        {/* Options Button */}
        <button
          id="welcome-options-btn"
          onClick={() => {
            soundManager.playMagicChime();
            onOpenOptions();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/50 border border-amber-900/40 text-amber-200/80 hover:text-amber-100 hover:border-amber-700 hover:bg-black/70 transition shadow-lg backdrop-blur-md text-xs font-cinzel tracking-wider cursor-pointer"
        >
          <Settings className="w-4 h-4 text-amber-400" />
          <span>Chamber Options</span>
        </button>
      </div>

      {/* Main Title & Chamber Emblem */}
      <div className="relative z-10 max-w-2xl text-center flex flex-col items-center">
        {/* Hogwarts Chamber Emblem */}
        <div className="relative mb-4 group cursor-default">
          <div className="w-20 h-20 rounded-full border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/80 to-black flex items-center justify-center shadow-[0_0_30px_rgba(217,119,6,0.3)] transition-transform duration-500 group-hover:scale-105">
            <BookOpen className="w-9 h-9 text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
        </div>

        {/* Ornate Heading */}
        <h1 className="font-gothic text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] mb-3">
          The Diary of Secrets
        </h1>

        {/* Riddle's Cryptic Subtitle */}
        <p className="font-parchment text-lg sm:text-xl text-amber-200/70 italic max-w-xl leading-relaxed mb-8 px-4">
          "What is written within these enchanted pages is never forgotten. Share your deepest confessions, and the shadow of the Dark Lord shall answer."
        </p>

        {/* Buttons Section */}
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          {/* Join as a guest button */}
          <button
            id="join-as-guest-btn"
            onClick={handleGuestClick}
            className="w-full group relative overflow-hidden rounded-xl border-2 border-amber-600/70 bg-gradient-to-r from-amber-950/90 via-[#261a12] to-amber-950/90 p-4 shadow-[0_0_20px_rgba(180,83,9,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:border-amber-400 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-3">
              <User className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-cinzel text-base sm:text-lg font-bold tracking-widest text-amber-100 uppercase drop-shadow">
                Join as a Guest
              </span>
            </div>
            <div className="text-[11px] text-amber-300/60 font-parchment italic mt-1 text-center">
              New to the castle • Configure your house & bloodline
            </div>
            {/* Soft inner glow line */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          </button>

          {/* Or join as a wizard button */}
          <button
            id="join-as-wizard-btn"
            onClick={handleWizardClick}
            className="w-full group relative rounded-xl border border-amber-800/40 bg-black/60 hover:bg-amber-950/40 hover:border-amber-600/60 p-3.5 shadow-lg backdrop-blur-md transition-all duration-300 cursor-pointer text-center"
          >
            <div className="flex items-center justify-center gap-2.5">
              <Wand2 className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span className="font-cinzel text-xs sm:text-sm font-semibold tracking-wider text-amber-200/90 group-hover:text-amber-100">
                or join as a wizard — if you've done this thing before
              </span>
            </div>

            {savedWizard ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-[11px] text-emerald-300 font-cinzel">
                <Shield className="w-3 h-3" />
                <span>
                  Resume as {savedWizard.name} ({savedWizard.house} • {savedWizard.grade})
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-amber-300/40 font-parchment italic mt-0.5">
                Restores where you last were and unlocks previous diary memories
              </div>
            )}
          </button>
        </div>

        {/* Footer Lore Hint */}
        <div className="mt-10 flex items-center gap-2 text-xs font-cinzel tracking-widest text-amber-400/40">
          <span className="w-8 h-px bg-amber-900/50" />
          <span>T. M. RIDDLE • CHAMBER OF SECRETS • 1943</span>
          <span className="w-8 h-px bg-amber-900/50" />
        </div>
      </div>
    </div>
  );
};
