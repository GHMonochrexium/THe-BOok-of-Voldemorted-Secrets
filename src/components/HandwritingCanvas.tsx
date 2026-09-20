import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Trash2, Sparkles, Feather } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface HandwritingCanvasProps {
  onStrokeChange?: (hasStrokes: boolean, dataUrl: string) => void;
  disabled?: boolean;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  onStrokeChange,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [inkColor, setInkColor] = useState<string>('#1f1610');
  const [nibWidth, setNibWidth] = useState<number>(3.5);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const lastScratchSoundTime = useRef<number>(0);

  const colors = [
    { id: '#1f1610', name: 'Raven Ink', label: 'Black' },
    { id: '#166534', name: 'Basilisk Venom', label: 'Emerald' },
    { id: '#991b1b', name: 'Dragon Blood', label: 'Crimson' },
    { id: '#b45309', name: 'Gilded Spell', label: 'Gold' },
  ];

  const nibSizes = [
    { width: 2, label: 'Fine Nib' },
    { width: 3.5, label: 'Quill Pen' },
    { width: 6, label: 'Broad Script' },
  ];

  // Resize canvas according to container
  const updateCanvasDimensions = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      redrawAllStrokes();
    }
  };

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, []);

  const redrawAllStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;

    if (stroke.points.length === 1) {
      const pt = stroke.points[0];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }

    const last = stroke.points[stroke.points.length - 1];
    const prev = stroke.points[stroke.points.length - 2];
    ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    ctx.stroke();
  };

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    const pos = getPointerPos(e);
    setIsDrawing(true);
    currentStrokeRef.current = [pos];

    // Trigger quill scratching sound effect
    soundManager.playQuillScratch();
    lastScratchSoundTime.current = Date.now();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const pos = getPointerPos(e);
    currentStrokeRef.current.push(pos);

    // Audio feedback while moving quill across parchment
    const now = Date.now();
    if (now - lastScratchSoundTime.current > 120) {
      soundManager.playQuillScratch();
      lastScratchSoundTime.current = now;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw active segment
    const pts = currentStrokeRef.current;
    if (pts.length >= 2) {
      ctx.strokeStyle = inkColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = nibWidth;

      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      const newStroke: Stroke = {
        points: [...currentStrokeRef.current],
        color: inkColor,
        width: nibWidth,
      };
      const updated = [...strokes, newStroke];
      setStrokes(updated);
      currentStrokeRef.current = [];

      notifyChange(updated);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    currentStrokeRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      ctx?.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
    notifyChange([]);
    soundManager.playPageTurn();
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    setTimeout(() => {
      redrawAllStrokes();
      notifyChange(updated);
    }, 10);
    soundManager.playPageTurn();
  };

  const notifyChange = (currentStrokes: Stroke[]) => {
    if (onStrokeChange && canvasRef.current) {
      const hasStrokes = currentStrokes.length > 0;
      const dataUrl = hasStrokes ? canvasRef.current.toDataURL('image/png') : '';
      onStrokeChange(hasStrokes, dataUrl);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-2 select-none">
      {/* Handwriting Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-amber-900/10 border border-amber-900/20 text-amber-900">
        {/* Ink Color Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-cinzel font-bold uppercase tracking-wider text-amber-950/70 mr-1">
            Ink:
          </span>
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setInkColor(c.id);
                soundManager.playQuillScratch();
              }}
              className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                inkColor === c.id
                  ? 'border-amber-900 scale-125 shadow-[0_0_6px_rgba(0,0,0,0.4)]'
                  : 'border-amber-900/40 opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.id }}
              title={`${c.name} (${c.label})`}
            />
          ))}
        </div>

        {/* Nib Thickness */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-cinzel font-bold uppercase tracking-wider text-amber-950/70 mr-1">
            Nib:
          </span>
          {nibSizes.map((n) => (
            <button
              key={n.width}
              type="button"
              onClick={() => {
                setNibWidth(n.width);
                soundManager.playQuillScratch();
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-cinzel transition cursor-pointer ${
                nibWidth === n.width
                  ? 'bg-amber-900 text-amber-100 font-bold'
                  : 'bg-amber-900/10 text-amber-900/70 hover:bg-amber-900/20'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Undo & Blot Canvas */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1 rounded text-amber-900/70 hover:text-amber-900 hover:bg-amber-900/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Undo last stroke"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-1 rounded text-amber-900/70 hover:text-red-800 hover:bg-amber-900/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Blot clean (Clear page)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* The Physical Inscription Parchment Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-52 sm:h-56 rounded-xl border border-amber-900/30 bg-[#f7eed6] shadow-inner overflow-hidden cursor-crosshair touch-none"
      >
        {/* Subtle lined rule guides like authentic Hogwarts school diary */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_27px,#d9caa1_28px)] [background-size:100%_28px] opacity-35 pointer-events-none" />

        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-amber-900/40 text-center px-4">
            <Feather className="w-7 h-7 mb-1 opacity-50" />
            <span className="font-handwritten text-lg sm:text-xl">
              Drag your quill across the parchment to handwrite your secret...
            </span>
            <span className="text-[10px] font-cinzel uppercase tracking-widest mt-1 opacity-60">
              Cursive script, runes, or symbols
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};
