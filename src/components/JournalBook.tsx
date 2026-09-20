import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Feather, Bookmark, Skull, History, CheckCircle2, RotateCw, Type, PenTool } from 'lucide-react';
import { DiaryEntry, WizardProfile } from '../types';
import { soundManager } from '../utils/audio';
import { HandwritingCanvas } from './HandwritingCanvas';

interface JournalBookProps {
  wizardProfile: WizardProfile;
  entries: DiaryEntry[];
  onSaveEntry: (entry: DiaryEntry) => void;
}

export const JournalBook: React.FC<JournalBookProps> = ({
  wizardProfile,
  entries,
  onSaveEntry,
}) => {
  const [inputText, setInputText] = useState('');
  const [writeMode, setWriteMode] = useState<'type' | 'quill-draw'>('type'); // Optional literal quill drawing mode!
  const [hasCanvasDrawing, setHasCanvasDrawing] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');
  const [category, setCategory] = useState<'Confession' | 'Dark Magic' | 'Memory' | 'Ambition' | 'Fear'>('Confession');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInkFading, setIsInkFading] = useState(false);
  const [voldemortReply, setVoldemortReply] = useState<string | null>(null);
  const [displayedReply, setDisplayedReply] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isEnchantedMemory, setIsEnchantedMemory] = useState<boolean>(false);
  const [isLiveAI, setIsLiveAI] = useState<boolean>(true);
  const typewriterTimerRef = useRef<any>(null);

  const latestEntry = entries[0];

  const handleKeyPress = () => {
    soundManager.playQuillScratch();
  };

  const handleCanvasChange = (hasStrokes: boolean, dataUrl: string) => {
    setHasCanvasDrawing(hasStrokes);
    setCanvasDataUrl(dataUrl);
  };

  const handleWriteToDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveText = inputText.trim() || (hasCanvasDrawing ? '[Handwritten Inscription / Sigil with Quill]' : '');
    if (!effectiveText || isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage('The ink begins to seep into the ancient parchment fibers...');
    setIsInkFading(true);
    soundManager.playGhostWhisper();

    try {
      // Call server endpoint /api/diary/reply
      const response = await fetch('/api/diary/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryText: effectiveText,
          drawingData: hasCanvasDrawing ? canvasDataUrl : undefined,
          wizardProfile,
          previousConversation: entries.slice(0, 3).map((entry) => ({
            role: 'user',
            text: entry.userText,
          })),
        }),
      });

      const data = await response.json();
      const ghostReply = data.reply || "I see what you hide behind your eyes. Darkness recognizes darkness.";
      setIsLiveAI(Boolean(data.isAI !== false));

      // Sinking ink visual timing
      setTimeout(() => {
        setIsInkFading(false);
        setVoldemortReply(ghostReply);
        setStatusMessage(data.isAI ? 'The Ghost of Voldemort analyzes your soul via Gemini AI...' : 'The Ghost of Voldemort responds from the shadows...');
        startTypewriterEffect(ghostReply, effectiveText, hasCanvasDrawing ? canvasDataUrl : undefined);
      }, 1300);

    } catch (err) {
      console.error('Error communicating with diary:', err);
      const fallback = `Your words burn into the parchment, ${wizardProfile.name}. The ordinary world fears what we discuss, but in this diary, your truth is immortal.`;
      setIsInkFading(false);
      setVoldemortReply(fallback);
      startTypewriterEffect(fallback, effectiveText, hasCanvasDrawing ? canvasDataUrl : undefined);
    }
  };

  const startTypewriterEffect = (fullText: string, originalUserText: string, drawingUrl?: string) => {
    let index = 0;
    setDisplayedReply('');
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);

    typewriterTimerRef.current = setInterval(() => {
      index++;
      setDisplayedReply(fullText.slice(0, index));
      soundManager.playQuillScratch();

      if (index >= fullText.length) {
        clearInterval(typewriterTimerRef.current);
        setIsSubmitting(false);
        setStatusMessage('Your secret and the Dark Lord\'s answer have been sealed in Firebase.');

        // Automatically store the entry
        const newEntry: DiaryEntry = {
          id: `entry_${Date.now()}`,
          wizardId: wizardProfile.id,
          wizardName: wizardProfile.name,
          house: wizardProfile.house,
          timestamp: new Date().toISOString(),
          userText: originalUserText,
          drawingData: drawingUrl,
          ghostReply: fullText,
          ghostAuthor: 'Tom Marvolo Riddle',
          isEnchantedMemory: isEnchantedMemory,
          category,
          inkColor: wizardProfile.house === 'Slytherin' ? '#22c55e' : '#d4af37',
          isAI: isLiveAI,
        };
        onSaveEntry(newEntry);
      }
    }, 38);
  };

  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, []);

  const handleResetForNewEntry = () => {
    setInputText('');
    setHasCanvasDrawing(false);
    setCanvasDataUrl('');
    setVoldemortReply(null);
    setDisplayedReply('');
    setStatusMessage('');
    soundManager.playPageTurn();
  };

  return (
    <div id="journal-book-container" className="w-full max-w-5xl mx-auto my-2 select-none">
      {/* 3D-styled Open Leather Book */}
      <div className="relative rounded-3xl p-3 sm:p-5 bg-gradient-to-r from-[#2c1d11] via-[#1a110a] to-[#2c1d11] shadow-[0_20px_60px_rgba(0,0,0,0.95)] border-4 border-[#4a331f]">
        {/* Metal Corner Brackets */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-600/70 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-600/70 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-600/70 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-600/70 rounded-br-lg pointer-events-none" />

        {/* Center Book Spine */}
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/40 via-black/80 to-black/40 shadow-inner z-20 pointer-events-none" />

        {/* Ribbon Bookmark */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-16 bg-emerald-800 border border-emerald-500/50 shadow-md z-30 rounded-b-sm" />

        {/* The Two Open Parchment Pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 rounded-2xl overflow-hidden bg-[#f4ebd0] text-amber-950 p-5 sm:p-7 shadow-2xl relative">
          
          {/* Subtle Parchment Page Texture & Watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5d3ab_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
          
          {/* LEFT PAGE: Chamber Chronicles & Past Echoes */}
          <div className="relative flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-900/20 pb-5 md:pb-0 md:pr-6">
            <div>
              {/* Left Page Header */}
              <div className="flex items-center justify-between border-b border-amber-900/20 pb-3 mb-3">
                <div className="text-left">
                  <span className="font-cinzel text-xs font-bold text-amber-900/60 uppercase tracking-widest block">
                    {wizardProfile.grade} • {wizardProfile.house}
                  </span>
                  <h3 className="font-gothic text-xl sm:text-2xl text-amber-950 tracking-wider">
                    Tom Riddle's Diary
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-full border border-amber-800/40 bg-amber-900/10 flex items-center justify-center text-amber-900 font-cinzel font-bold text-xs">
                  TMR
                </div>
              </div>

              {/* Watermark Quote */}
              <div className="p-3 rounded-xl bg-amber-900/5 border border-amber-900/15 mb-4 text-center">
                <p className="font-handwritten text-base text-amber-900/80 italic leading-snug">
                  "I was preserved in these pages by a memory... Confide in me your true desires."
                </p>
                <span className="block text-[10px] font-cinzel text-amber-900/50 mt-1">
                  — Tom Marvolo Riddle, 1943
                </span>
              </div>

              {/* Category of Secret */}
              <div className="space-y-1.5 mb-4">
                <label className="text-[11px] font-cinzel text-amber-900/70 font-semibold uppercase tracking-wider block">
                  Nature of this Secret:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Confession', 'Dark Magic', 'Memory', 'Ambition', 'Fear'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        soundManager.playMagicChime();
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-cinzel transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-amber-900 text-amber-100 shadow-sm font-bold'
                          : 'bg-amber-900/10 text-amber-900/70 hover:bg-amber-900/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Latest Echo / Memory from Diary */}
              {latestEntry ? (
                <div className="space-y-2 bg-amber-900/10 rounded-xl p-3 border border-amber-900/20">
                  <div className="flex items-center justify-between text-[11px] font-cinzel text-amber-900/60">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      <span>Last Inscribed Memory</span>
                    </span>
                    <span>{new Date(latestEntry.timestamp).toLocaleDateString()}</span>
                  </div>

                  {latestEntry.drawingData ? (
                    <div className="w-full h-16 rounded bg-[#f7eed6] border border-amber-900/20 p-1 flex items-center justify-center overflow-hidden">
                      <img src={latestEntry.drawingData} alt="Handwritten quill stroke" className="max-h-full object-contain" />
                    </div>
                  ) : (
                    <p className="font-handwritten text-sm text-amber-900/90 line-clamp-2 italic">
                      "{latestEntry.userText}"
                    </p>
                  )}

                  <div className="text-xs font-voldemort text-emerald-950 font-bold line-clamp-2 pt-1 border-t border-amber-900/15">
                    Tom: "{latestEntry.ghostReply}"
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-amber-900/50 font-parchment italic text-sm">
                  The pages are presently immaculate. Inscribe your first confession into the binding.
                </div>
              )}
            </div>

            {/* Left Page Footer */}
            <div className="pt-3 border-t border-amber-900/20 flex items-center justify-between text-[11px] font-cinzel text-amber-900/60">
              <span>{entries.length} Secrets Recorded</span>
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Chamber Active</span>
              </span>
            </div>
          </div>

          {/* RIGHT PAGE: Active Ink Writing & Ghost of Voldemort Response */}
          <div className="relative flex flex-col justify-between">
            <div>
              {/* Right Page Header with Mode Selector (Type vs Write with Quill) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/20 pb-2.5 mb-3">
                <div className="flex items-center gap-1.5">
                  <Feather className="w-4 h-4 text-amber-800" />
                  <span className="font-cinzel text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Inscribe Page
                  </span>
                </div>

                {/* Optional Literal Quill Drawing Toggle */}
                {!voldemortReply && (
                  <div className="flex items-center gap-1 rounded-lg bg-amber-900/10 p-0.5 border border-amber-900/20">
                    <button
                      type="button"
                      onClick={() => {
                        setWriteMode('type');
                        soundManager.playMagicChime();
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-cinzel transition cursor-pointer ${
                        writeMode === 'type'
                          ? 'bg-amber-900 text-amber-100 font-bold shadow-sm'
                          : 'text-amber-900/60 hover:text-amber-900'
                      }`}
                      title="Type your secret with typewriter keyboard"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Type</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWriteMode('quill-draw');
                        soundManager.playPageTurn();
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-cinzel transition cursor-pointer ${
                        writeMode === 'quill-draw'
                          ? 'bg-emerald-900 text-emerald-100 font-bold shadow-sm'
                          : 'text-amber-900/60 hover:text-emerald-900'
                      }`}
                      title="Literally write with the feather quill directly on the parchment"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Write with Quill 🪶</span>
                    </button>
                  </div>
                )}

                {/* Enchant Memory Star */}
                <button
                  type="button"
                  onClick={() => setIsEnchantedMemory(!isEnchantedMemory)}
                  className={`flex items-center gap-1 text-[11px] font-cinzel px-2 py-0.5 rounded transition cursor-pointer ${
                    isEnchantedMemory
                      ? 'bg-amber-800 text-amber-100 font-bold'
                      : 'text-amber-900/60 hover:text-amber-900'
                  }`}
                  title="Store as a radiant enchanted memory"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{isEnchantedMemory ? 'Enchanted ★' : 'Enchant'}</span>
                </button>
              </div>

              {/* If Voldemort has responded, show the dialogue transformation */}
              {voldemortReply ? (
                <div className="space-y-3">
                  {/* Your submitted confession or drawing */}
                  <div className="bg-amber-900/5 p-3 rounded-lg border border-amber-900/10">
                    <span className="text-[10px] font-cinzel text-amber-900/50 uppercase tracking-widest block mb-1">
                      Your Inscribed Secret:
                    </span>
                    {canvasDataUrl ? (
                      <div className="w-full max-h-24 rounded bg-[#f7eed6] border border-amber-900/20 p-1 overflow-hidden flex items-center justify-center">
                        <img src={canvasDataUrl} alt="Handwritten quill stroke" className="max-h-full object-contain" />
                      </div>
                    ) : (
                      <p className="font-handwritten text-base text-amber-900 italic">
                        "{inputText}"
                      </p>
                    )}
                  </div>

                  {/* The Ghost of Voldemort's handwriting */}
                  <div className="relative bg-[#0c140e] text-emerald-300 p-4 rounded-xl border border-emerald-600/50 shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all">
                    <div className="flex items-center justify-between text-emerald-400 mb-2 border-b border-emerald-900/50 pb-1.5">
                      <div className="flex items-center gap-2">
                        <Skull className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="font-cinzel text-xs font-bold tracking-widest uppercase text-emerald-200">
                          The Ghost of Voldemort Answers:
                        </span>
                      </div>
                      {isLiveAI && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                          Gemini AI
                        </span>
                      )}
                    </div>

                    <p className="font-voldemort text-base sm:text-lg text-emerald-200 leading-relaxed drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                      "{displayedReply}"
                    </p>

                    {isSubmitting && (
                      <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-ping" />
                    )}
                  </div>

                  {/* Continue / Inscribe Next Secret Button */}
                  {!isSubmitting && (
                    <button
                      onClick={handleResetForNewEntry}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-100 font-cinzel text-xs uppercase tracking-wider transition shadow cursor-pointer mt-1"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Write Another Secret to the Diary</span>
                    </button>
                  )}
                </div>
              ) : (
                /* The Writing Input Form */
                <form onSubmit={handleWriteToDiary} className="space-y-3">
                  {/* Mode 1: Literal Handwriting Canvas with Quill */}
                  {writeMode === 'quill-draw' ? (
                    <div className="space-y-2">
                      <HandwritingCanvas onStrokeChange={handleCanvasChange} disabled={isSubmitting} />
                      {/* Optional caption/text input for student drawing */}
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Optional: whisper what this sigil or drawing means..."
                        className="w-full px-3 py-1.5 rounded-lg bg-amber-900/5 border border-amber-900/20 font-handwritten text-base text-amber-950 placeholder:text-amber-900/40 focus:outline-none focus:border-amber-700"
                      />
                    </div>
                  ) : (
                    /* Mode 2: Standard Typing on Parchment */
                    <div className="relative">
                      <textarea
                        id="diary-confession-input"
                        rows={6}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isSubmitting}
                        placeholder="Write your darkest confession, doubts, or desires here... The ink will sink into the paper."
                        className={`w-full bg-transparent border-0 font-handwritten text-lg sm:text-xl text-amber-950 placeholder:text-amber-900/40 focus:ring-0 focus:outline-none resize-none leading-relaxed transition-all duration-1000 ${
                          isInkFading ? 'opacity-20 blur-sm scale-98 translate-y-2' : 'opacity-100'
                        }`}
                        required={!hasCanvasDrawing}
                      />

                      {/* Sinking ink visual effect overlay */}
                      {isInkFading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-100/50 backdrop-blur-[1px] rounded-lg">
                          <div className="text-center font-cinzel text-xs text-amber-900 animate-pulse flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-700 animate-spin" />
                            <span>The ink is sinking through the parchment fibers...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      id="submit-diary-entry-btn"
                      type="submit"
                      disabled={isSubmitting || (!inputText.trim() && !hasCanvasDrawing)}
                      className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 hover:from-black hover:via-emerald-950 hover:to-black text-amber-100 border border-amber-950/60 p-3 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Feather className="w-4 h-4 text-amber-300 group-hover:scale-110 group-hover:text-emerald-400 transition-all" />
                        <span className="font-cinzel text-xs sm:text-sm font-bold tracking-widest uppercase text-amber-100 group-hover:text-emerald-200">
                          {isSubmitting ? 'Summoning The Shadows...' : 'Confide in the Ghost of Voldemort'}
                        </span>
                        <Send className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Page Status */}
            <div className="pt-2 border-t border-amber-900/20 flex items-center justify-between text-[11px] font-cinzel text-amber-900/60">
              <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                {statusMessage ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{statusMessage}</span>
                  </>
                ) : (
                  <span>The ink vanishes as it is read</span>
                )}
              </div>
              <span className="text-[10px] text-amber-900/40">Firebase Vault</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
