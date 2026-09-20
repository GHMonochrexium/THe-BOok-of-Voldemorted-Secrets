import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Scroll, 
  Shield, 
  Settings, 
  Search, 
  Bookmark, 
  Skull, 
  Flame, 
  LogOut,
  Calendar,
  Layers,
  Database,
  Music,
  PenTool
} from 'lucide-react';
import { DiaryEntry, HogwartsHouse, MainTab, WizardProfile } from '../types';
import { JournalBook } from './JournalBook';
import { soundManager } from '../utils/audio';

interface HogwartsLibraryProps {
  wizardProfile: WizardProfile;
  entries: DiaryEntry[];
  onSaveEntry: (entry: DiaryEntry) => void;
  onOpenOptions: () => void;
  onSignOut: () => void;
}

export const HogwartsLibrary: React.FC<HogwartsLibraryProps> = ({
  wizardProfile,
  entries,
  onSaveEntry,
  onOpenOptions,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>('journal');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isPlayingMusic, setIsPlayingMusic] = useState(soundManager.isHedwigsThemePlaying());

  useEffect(() => {
    setIsPlayingMusic(soundManager.isHedwigsThemePlaying());
  }, []);

  const handleToggleMusic = () => {
    const isPlaying = soundManager.toggleHedwigsTheme();
    setIsPlayingMusic(isPlaying);
  };

  const getHouseColors = (house: HogwartsHouse) => {
    switch (house) {
      case 'Gryffindor':
        return {
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)] border-red-500/80 bg-red-950/40 text-red-200',
          accent: 'text-red-400',
          badgeBg: 'bg-red-950/70 border-red-800/60',
          seal: '🦁',
        };
      case 'Slytherin':
        return {
          glow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)] border-emerald-500/80 bg-emerald-950/40 text-emerald-200',
          accent: 'text-emerald-400',
          badgeBg: 'bg-emerald-950/70 border-emerald-800/60',
          seal: '🐍',
        };
      case 'Ravenclaw':
        return {
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)] border-blue-500/80 bg-blue-950/40 text-blue-200',
          accent: 'text-blue-400',
          badgeBg: 'bg-blue-950/70 border-blue-800/60',
          seal: '🦅',
        };
      case 'Hufflepuff':
      default:
        return {
          glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)] border-amber-500/80 bg-amber-950/40 text-amber-200',
          accent: 'text-amber-400',
          badgeBg: 'bg-amber-950/70 border-amber-800/60',
          seal: '🦡',
        };
    }
  };

  const houseStyle = getHouseColors(wizardProfile.house);

  const tabs: { id: MainTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'journal', label: "Tom Riddle's Diary", icon: <BookOpen className="w-4 h-4" /> },
    { id: 'memories', label: 'Enchanted Memories', icon: <Bookmark className="w-4 h-4" />, count: entries.length },
    { id: 'archive', label: 'Forbidden Archive', icon: <Skull className="w-4 h-4" /> },
    { id: 'profile', label: 'Wizard Dossier', icon: <Shield className="w-4 h-4" /> },
  ];

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = 
      e.userText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.ghostReply.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="hogwarts-library-container" className="relative min-h-screen w-full flex flex-col bg-[#0b0806] text-amber-100 overflow-x-hidden select-none">
      {/* Gothic Library Atmospheric Backdrop with Candles */}
      <div className="fixed inset-0 -z-10 bg-radial from-[#1e150d]/80 via-[#0f0a07] to-black" />
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Top Hogwarts Header */}
      <header className="w-full border-b border-amber-900/30 bg-black/60 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & House Crest */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shadow-md ${houseStyle.badgeBg}`}>
              {houseStyle.seal}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-gothic text-base sm:text-lg text-amber-200 tracking-wider">
                  The Diary of Secrets
                </span>
                <span className="text-[10px] font-cinzel px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300">
                  Hogwarts Library
                </span>
              </div>
              <div className="text-xs font-parchment text-amber-300/60 italic">
                Restricted Section • Inscriber: <span className="text-amber-200 font-cinzel font-semibold">{wizardProfile.name}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Options */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Hedwig's Theme Music Button */}
            <button
              id="library-hedwig-music-btn"
              onClick={handleToggleMusic}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-cinzel tracking-wider transition shadow cursor-pointer ${
                isPlayingMusic
                  ? 'bg-purple-950/80 border-purple-500/70 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-black/50 border-amber-900/40 text-amber-300/80 hover:text-amber-100 hover:border-amber-700'
              }`}
              title="Play or Pause Hedwig's Theme (Harry Potter Music)"
            >
              <Music className={`w-3.5 h-3.5 text-amber-400 ${isPlayingMusic ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isPlayingMusic ? 'Hedwig\'s Theme ♫' : 'Theme Song ♫'}</span>
            </button>

            {/* Options Button */}
            <button
              id="library-options-btn"
              onClick={() => {
                soundManager.playMagicChime();
                onOpenOptions();
              }}
              className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 transition cursor-pointer"
              title="Chamber Options (Sound, Cursor, Storage)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Leave Chamber */}
            <button
              id="library-signout-btn"
              onClick={() => {
                soundManager.playPageTurn();
                onSignOut();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-amber-900/40 text-xs font-cinzel text-amber-300/70 hover:text-amber-200 hover:border-amber-700 transition cursor-pointer"
              title="Close the journal and return to chamber gates"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Depart Library</span>
            </button>
          </div>
        </div>
      </header>

      {/* Atmospheric Handwritten-Style Tabs Header */}
      <div className="w-full border-b border-amber-900/20 bg-gradient-to-b from-black/80 to-transparent py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  soundManager.playPageTurn();
                  soundManager.playMagicChime();
                }}
                className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-sm font-handwritten tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? `border font-bold scale-105 ${houseStyle.glow} bg-amber-950/70 text-amber-100 animate-pulse-glow`
                    : 'border border-amber-900/30 bg-black/40 text-amber-200/60 hover:text-amber-100 hover:bg-amber-950/30 hover:border-amber-700/50'
                }`}
              >
                {/* Soft mystical tab glow indicator */}
                {isSelected && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                )}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className="text-[11px] font-cinzel px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-200">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content View Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {/* TAB 1: TOM RIDDLE'S DIARY (THE CENTRAL BOOK) */}
        {activeTab === 'journal' && (
          <JournalBook
            wizardProfile={wizardProfile}
            entries={entries}
            onSaveEntry={onSaveEntry}
          />
        )}

        {/* TAB 2: ENCHANTED MEMORIES */}
        {activeTab === 'memories' && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 border border-amber-900/30 p-4 rounded-2xl backdrop-blur-md">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search secrets & echoes..."
                  className="w-full rounded-xl bg-black/60 border border-amber-800/40 pl-9 pr-3 py-2 text-xs font-cinzel text-amber-100 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-4 h-4 text-amber-500/60 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {['all', 'Confession', 'Dark Magic', 'Memory', 'Ambition', 'Fear'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilterCategory(cat);
                      soundManager.playMagicChime();
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-cinzel transition cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-amber-700 text-amber-100 font-bold'
                        : 'bg-black/50 text-amber-300/60 hover:text-amber-200 border border-amber-900/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Enchanted Memories */}
            {filteredEntries.length === 0 ? (
              <div className="text-center py-16 bg-black/30 rounded-3xl border border-amber-900/20 p-6">
                <Bookmark className="w-12 h-12 text-amber-700/50 mx-auto mb-3" />
                <h3 className="font-gothic text-xl text-amber-200">No Secrets Unveiled</h3>
                <p className="font-parchment text-amber-300/60 text-sm max-w-md mx-auto italic mt-1">
                  You have not yet written to Tom Riddle, or your search query matches no preserved confessions.
                </p>
                <button
                  onClick={() => setActiveTab('journal')}
                  className="mt-5 px-5 py-2 rounded-xl bg-amber-800/70 hover:bg-amber-700 text-amber-100 text-xs font-cinzel tracking-wider transition cursor-pointer"
                >
                  Write Your First Secret
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative rounded-2xl border border-amber-800/40 bg-gradient-to-b from-[#19130f] to-[#0c0907] p-5 shadow-lg space-y-3 group hover:border-amber-500/60 transition-all"
                  >
                    {/* Entry Header */}
                    <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                      <span className="text-[11px] font-cinzel text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        {new Date(entry.timestamp).toLocaleDateString()} • {entry.category}
                      </span>
                      {entry.isEnchantedMemory && (
                        <span className="text-[10px] font-cinzel text-amber-300 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/40 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Enchanted</span>
                        </span>
                      )}
                    </div>

                    {/* Student's Confession */}
                    <div>
                      <span className="text-[10px] font-cinzel text-amber-400/50 uppercase tracking-widest block mb-1">
                        Inscribed Confession:
                      </span>
                      {entry.drawingData ? (
                        <div className="space-y-1.5">
                          <div className="w-full h-24 rounded-xl bg-[#f7eed6] border border-amber-900/30 p-1.5 flex items-center justify-center overflow-hidden shadow-inner">
                            <img src={entry.drawingData} alt="Handwritten quill inscription" className="max-h-full object-contain" />
                          </div>
                          {entry.userText && !entry.userText.startsWith('[Handwritten') && (
                            <p className="font-handwritten text-sm text-amber-200/80 italic">
                              "{entry.userText}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="font-handwritten text-base text-amber-100/90 italic leading-relaxed">
                          "{entry.userText}"
                        </p>
                      )}
                    </div>

                    {/* The Ghost of Voldemort's Answer */}
                    <div className="rounded-xl bg-[#09100a] p-3.5 border border-emerald-900/40 text-emerald-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-cinzel text-emerald-400 mb-1">
                        <Skull className="w-3 h-3 text-emerald-400" />
                        <span className="tracking-widest uppercase">The Shadow Replies:</span>
                      </div>
                      <p className="font-voldemort text-sm text-emerald-300 leading-snug">
                        "{entry.ghostReply}"
                      </p>
                    </div>

                    {/* Firebase Vault Tag */}
                    <div className="flex items-center justify-between pt-1 text-[10px] text-amber-400/40 font-mono">
                      <span>Ref: {entry.id.slice(-8)}</span>
                      <span>Sealed in Vault</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FORBIDDEN ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="rounded-3xl border border-amber-900/40 bg-gradient-to-b from-[#18110c] to-[#0a0705] p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-amber-900/30 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                  <Skull className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-gothic text-2xl text-amber-200">
                    The Forbidden Archive of 1943
                  </h2>
                  <p className="font-parchment text-sm text-amber-300/60 italic">
                    Historical records recovered from the Chamber of Secrets
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-black/40 border border-amber-900/30 p-4 space-y-2">
                  <span className="text-xs font-cinzel text-amber-400 font-bold block">
                    I. The Enchanted Diary
                  </span>
                  <p className="text-xs font-parchment text-amber-200/70 leading-relaxed italic">
                    Purchased in a Muggle newsagent on Vauxhall Road. Bound in blank pages, it houses the soul and memories of the sixteen-year-old Tom Marvolo Riddle.
                  </p>
                </div>

                <div className="rounded-2xl bg-black/40 border border-amber-900/30 p-4 space-y-2">
                  <span className="text-xs font-cinzel text-emerald-400 font-bold block">
                    II. The Language of Serpents
                  </span>
                  <p className="text-xs font-parchment text-amber-200/70 leading-relaxed italic">
                    "Parseltongue is not merely a tongue; it is an instinct of dominance. The diary whispers in serpent sibilance to those who dare listen."
                  </p>
                </div>

                <div className="rounded-2xl bg-black/40 border border-amber-900/30 p-4 space-y-2">
                  <span className="text-xs font-cinzel text-amber-400 font-bold block">
                    III. The Disappearing Ink
                  </span>
                  <p className="text-xs font-parchment text-amber-200/70 leading-relaxed italic">
                    Words written into this diary do not dry; they dissolve. The diary consumes the secrets of the writer until their willpower bends to its will.
                  </p>
                </div>
              </div>

              {/* Lore excerpt */}
              <div className="rounded-2xl bg-emerald-950/20 border border-emerald-800/30 p-5 text-emerald-200">
                <div className="font-cinzel text-xs uppercase tracking-widest text-emerald-400 mb-2">
                  Warning from the Headmaster's Office:
                </div>
                <p className="font-handwritten text-base leading-relaxed italic text-amber-100/90">
                  "Never trust anything that can think for itself if you cannot see where it keeps its brain. The diary of Tom Riddle is treacherous, feeding upon confessions and promising greatness at the cost of your very autonomy."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WIZARD DOSSIER */}
        {activeTab === 'profile' && (
          <div className="w-full max-w-2xl mx-auto">
            <div className="rounded-3xl border border-amber-800/40 bg-gradient-to-b from-[#1c1510] to-[#0c0806] p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 border-b border-amber-900/30 pb-5">
                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-xl ${houseStyle.badgeBg} ${houseStyle.glow}`}>
                  {houseStyle.seal}
                </div>
                <div>
                  <h3 className="font-gothic text-2xl text-amber-100">
                    {wizardProfile.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-900/50 border border-amber-700/40 text-xs font-cinzel text-amber-300">
                      {wizardProfile.house}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-900/40 text-xs font-cinzel text-amber-400">
                      {wizardProfile.bloodStatus}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-900/40 text-xs font-cinzel text-amber-200/80">
                      {wizardProfile.grade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Attributes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-black/30 border border-amber-900/30 p-3.5">
                  <span className="text-[10px] font-cinzel uppercase text-amber-400/60 block">
                    Secrets Inscribed
                  </span>
                  <span className="text-xl font-gothic text-amber-200">
                    {entries.length} Entries
                  </span>
                </div>
                <div className="rounded-xl bg-black/30 border border-amber-900/30 p-3.5">
                  <span className="text-[10px] font-cinzel uppercase text-amber-400/60 block">
                    Vault Synchronized
                  </span>
                  <span className="text-xl font-gothic text-emerald-400 flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    <span>Firebase Active</span>
                  </span>
                </div>
              </div>

              {/* Inscription Lore */}
              <div className="rounded-xl bg-amber-950/20 border border-amber-900/30 p-4">
                <p className="font-parchment text-sm text-amber-200/80 italic leading-relaxed">
                  "When you return as a wizard, this diary recognizes your touch and immediately restores your place in the restricted chamber. Your secrets remain immortalized in ink."
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
