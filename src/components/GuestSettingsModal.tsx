import React, { useState } from 'react';
import { Sparkles, Shield, Flame, Compass, Feather, Award, ChevronRight, Check } from 'lucide-react';
import { BloodStatus, HogwartsHouse, HogwartsYear, WizardProfile } from '../types';
import { soundManager } from '../utils/audio';

interface GuestSettingsModalProps {
  onComplete: (profile: WizardProfile) => void;
  onBack: () => void;
  initialProfile?: WizardProfile | null;
}

export const GuestSettingsModal: React.FC<GuestSettingsModalProps> = ({
  onComplete,
  onBack,
  initialProfile,
}) => {
  const [name, setName] = useState(initialProfile?.name || 'Cassian Blackwood');
  const [house, setHouse] = useState<HogwartsHouse>(initialProfile?.house || 'Slytherin');
  const [bloodStatus, setBloodStatus] = useState<BloodStatus>(initialProfile?.bloodStatus || 'Pure-blood');
  const [grade, setGrade] = useState<HogwartsYear>(initialProfile?.grade || 'Fifth Year');

  const houses: { id: HogwartsHouse; name: string; trait: string; colors: string; border: string; glow: string; icon: string }[] = [
    {
      id: 'Gryffindor',
      name: 'Gryffindor',
      trait: 'Courage, Bravery, & Chivalry',
      colors: 'from-red-950/80 via-red-900/40 to-black',
      border: 'border-red-600/70 hover:border-red-400',
      glow: 'shadow-[0_0_20px_rgba(220,38,38,0.35)]',
      icon: '🦁',
    },
    {
      id: 'Slytherin',
      name: 'Slytherin',
      trait: 'Ambition, Cunning, & Resourcefulness',
      colors: 'from-emerald-950/80 via-emerald-900/40 to-black',
      border: 'border-emerald-600/70 hover:border-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
      icon: '🐍',
    },
    {
      id: 'Ravenclaw',
      name: 'Ravenclaw',
      trait: 'Wisdom, Wit, & Intellect',
      colors: 'from-blue-950/80 via-blue-900/40 to-black',
      border: 'border-blue-600/70 hover:border-blue-400',
      glow: 'shadow-[0_0_20px_rgba(37,99,235,0.35)]',
      icon: '🦅',
    },
    {
      id: 'Hufflepuff',
      name: 'Hufflepuff',
      trait: 'Dedication, Patience, & Loyalty',
      colors: 'from-amber-950/80 via-amber-900/40 to-black',
      border: 'border-amber-600/70 hover:border-amber-400',
      glow: 'shadow-[0_0_20px_rgba(217,119,6,0.35)]',
      icon: '🦡',
    },
  ];

  const bloodOptions: { id: BloodStatus; label: string; lore: string }[] = [
    { id: 'Pure-blood', label: 'Pure-blood', lore: 'Descendant of ancestral magical bloodlines' },
    { id: 'Half-blood', label: 'Half-blood', lore: 'Walking the threshold of both worlds' },
    { id: 'Muggle-born', label: 'Muggle-born', lore: 'First generation endowed with raw sorcery' },
  ];

  const years: HogwartsYear[] = [
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year',
    'Fifth Year',
    'Sixth Year',
    'Seventh Year',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playMagicChime();
    const newProfile: WizardProfile = {
      id: initialProfile?.id || `wiz_${Date.now()}`,
      name: name.trim() || 'Nameless Wizard',
      house,
      bloodStatus,
      grade,
      isGuest: true,
      registeredAt: initialProfile?.registeredAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    onComplete(newProfile);
  };

  return (
    <div
      id="guest-settings-screen"
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none"
    >
      {/* Moody Dark Background */}
      <div className="fixed inset-0 -z-10 bg-radial from-[#1e150f] via-[#0e0a07] to-black" />

      <div className="w-full max-w-3xl rounded-3xl border border-amber-800/40 bg-gradient-to-b from-[#19130f]/95 via-[#110d0a]/95 to-[#090705]/98 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-xl relative my-auto">
        {/* Hogwarts Seal Top Accent */}
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-gothic text-2xl sm:text-3xl text-amber-200 tracking-wider">
                The Sorting of Secrets
              </h2>
              <p className="font-parchment text-sm text-amber-300/60 italic">
                Declare your bloodline, house, and scholastic year before opening the diary
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-xs font-cinzel text-amber-400/60 hover:text-amber-200 transition px-3 py-1.5 rounded-lg border border-amber-900/30 hover:bg-amber-900/20"
          >
            ← Return
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Wizard Name Input */}
          <div className="space-y-2">
            <label className="block text-xs font-cinzel tracking-widest text-amber-300 uppercase">
              Wizard's Inscribed Name
            </label>
            <div className="relative">
              <input
                id="wizard-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Harry Potter, Draco Malfoy..."
                className="w-full rounded-xl bg-black/50 border border-amber-800/50 px-4 py-3 text-amber-100 font-cinzel text-base focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition shadow-inner placeholder:text-amber-900/50"
                required
              />
              <Feather className="w-4 h-4 text-amber-500/60 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* House Selection (The Four Houses) */}
          <div className="space-y-3">
            <label className="block text-xs font-cinzel tracking-widest text-amber-300 uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Select Your Hogwarts House</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {houses.map((h) => {
                const isSelected = house === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setHouse(h.id);
                      soundManager.playMagicChime();
                    }}
                    className={`relative rounded-2xl border p-4 text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                      isSelected
                        ? `${h.border} ${h.glow} bg-gradient-to-br ${h.colors} scale-[1.01]`
                        : 'border-amber-950/60 bg-black/40 hover:bg-amber-950/20 hover:border-amber-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{h.icon}</span>
                        <span className="font-cinzel text-lg font-bold text-amber-100 tracking-wider">
                          {h.name}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-200">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="font-parchment text-xs text-amber-200/70 italic pl-1">
                      {h.trait}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blood Status & Scholastic Year Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blood Status */}
            <div className="space-y-3">
              <label className="block text-xs font-cinzel tracking-widest text-amber-300 uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Blood Status Lineage</span>
              </label>
              <div className="space-y-2">
                {bloodOptions.map((opt) => {
                  const isSelected = bloodStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setBloodStatus(opt.id);
                        soundManager.playQuillScratch();
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500/70 bg-amber-950/50 text-amber-100 shadow-[0_0_12px_rgba(217,119,6,0.25)]'
                          : 'border-amber-950/40 bg-black/30 text-amber-200/60 hover:bg-amber-950/20 hover:text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-cinzel text-sm font-semibold">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] font-parchment italic text-amber-300/50 mt-0.5">
                        {opt.lore}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hogwarts Grade / Scholastic Year */}
            <div className="space-y-3">
              <label className="block text-xs font-cinzel tracking-widest text-amber-300 uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Hogwarts Grade & Year</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1 hide-scrollbar">
                {years.map((y) => {
                  const isSelected = grade === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setGrade(y);
                        soundManager.playQuillScratch();
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-lg border text-xs font-cinzel transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500/80 bg-amber-900/40 text-amber-100 font-bold'
                          : 'border-amber-950/40 bg-black/30 text-amber-200/60 hover:bg-amber-950/20 hover:text-amber-200'
                      }`}
                    >
                      <span>{y}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit and Open Main Menu */}
          <div className="pt-4 border-t border-amber-900/30">
            <button
              id="confirm-sorting-btn"
              type="submit"
              className="w-full group relative overflow-hidden rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 p-4 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] transition-all duration-300 cursor-pointer text-center"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="font-cinzel text-lg font-extrabold tracking-widest text-amber-100 uppercase drop-shadow">
                  Open The Hogwarts Library
                </span>
                <ChevronRight className="w-5 h-5 text-amber-200 group-hover:translate-x-1.5 transition-transform" />
              </div>
              <div className="text-xs text-amber-200/80 font-parchment italic mt-0.5">
                The Diary awaits your confession in the restricted section
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
