import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, BookOpen, User, Wand2, Shield, Music, Cloud, CloudLightning, CheckCircle2 } from 'lucide-react';
import { WizardProfile } from '../types';
import { soundManager } from '../utils/audio';
import { User as FirebaseUser } from 'firebase/auth';
import bgImage from '../assets/images/hogwarts_trio_background_1789907714805.jpg';

interface WelcomeScreenProps {
  currentUser: FirebaseUser | null;
  isSyncingCloud?: boolean;
  onSignInWithGoogle: () => void;
  onJoinAsGuest: () => void;
  onJoinAsWizard: () => void;
  onOpenOptions: () => void;
  savedWizard: WizardProfile | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentUser,
  isSyncingCloud,
  onSignInWithGoogle,
  onJoinAsGuest,
  onJoinAsWizard,
  onOpenOptions,
  savedWizard,
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = useState(soundManager.isMusicActive());

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

  const handleGuestClick = () => {
    soundManager.unlockAudio();
    if (!soundManager.isMusicActive()) {
      soundManager.startMusic();
    }
    soundManager.playPageTurn();
    onJoinAsGuest();
  };

  const handleWizardClick = () => {
    soundManager.unlockAudio();
    if (!soundManager.isMusicActive()) {
      soundManager.startMusic();
    }
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
        <p className="font-parchment text-lg sm:text-xl text-amber-200/70 italic max-w-xl leading-relaxed mb-6 px-4">
          "What is written within these enchanted pages is never forgotten. Share your deepest confessions, and the shadow of the Dark Lord shall answer."
        </p>

        {/* Prominent Harry Potter Music Feature Banner */}
        <div className="w-full max-w-md mb-6">
          <button
            id="welcome-music-hero-btn"
            onClick={handleToggleMusic}
            className={`w-full group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 shadow-xl cursor-pointer ${
              isPlayingMusic
                ? 'bg-gradient-to-r from-purple-950/80 via-amber-950/60 to-purple-950/80 border-purple-500/70 text-purple-100 shadow-[0_0_25px_rgba(168,85,247,0.35)]'
                : 'bg-black/60 hover:bg-amber-950/50 border-amber-600/60 hover:border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            }`}
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${
                isPlayingMusic 
                  ? 'bg-purple-900/60 border-purple-400/50 text-amber-300' 
                  : 'bg-amber-950/80 border-amber-700/60 text-amber-400'
              }`}>
                <Music className={`w-5 h-5 ${isPlayingMusic ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <div className="font-cinzel text-sm sm:text-base font-bold tracking-wider text-amber-100 flex items-center gap-2">
                  <span>{isPlayingMusic ? "Hedwig's Theme Playing" : "Play Harry Potter Music"}</span>
                  {isPlayingMusic ? (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="text-xs text-amber-300/70 font-parchment italic">
                  {isPlayingMusic 
                    ? "Celesta bells & strings • John Williams Soundtrack" 
                    : "Touch to ignite the legendary Hogwarts celesta melody"}
                </div>
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-xl font-cinzel text-xs font-bold tracking-wider shrink-0 transition-transform group-hover:scale-105 ${
              isPlayingMusic 
                ? 'bg-purple-900/70 border border-purple-500/50 text-purple-200' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
            }`}>
              {isPlayingMusic ? 'Pause ♫' : 'Play Theme ♫'}
            </div>
          </button>
        </div>

        {/* Buttons Section */}
        <div className="w-full max-w-md flex flex-col items-center gap-3.5">
          {/* Sign In with Google ID (Firebase Database Cloud Sync) */}
          <button
            id="google-signin-btn"
            onClick={onSignInWithGoogle}
            disabled={isSyncingCloud}
            className="w-full group relative overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-[#2a1708] via-[#1c0f06] to-[#2a1708] p-4 shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] hover:border-amber-300 transition-all duration-300 cursor-pointer text-left"
          >
            {/* Soft shimmering magical rays */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {/* Google G Logo inside magical golden seal */}
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-2 shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-cinzel text-base sm:text-lg font-bold tracking-wider text-amber-100 flex items-center gap-2">
                    <span>{currentUser ? `Resume as ${currentUser.displayName || 'Wizard'}` : 'Sign in with Google ID'}</span>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-xs text-amber-300/80 font-parchment italic">
                    {currentUser 
                      ? 'Cloud database connected • Conversations retrieved automatically' 
                      : 'Store conversations & retrieve chats via Firebase Cloud Database'}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-cinzel text-xs font-bold shrink-0">
                <Cloud className="w-3.5 h-3.5" />
                <span>{currentUser ? 'Cloud Active' : 'Sign In'}</span>
              </div>
            </div>

            {/* Glowing line */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          </button>

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
