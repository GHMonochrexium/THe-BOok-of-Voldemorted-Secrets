import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
}

interface QuillCursorProps {
  enabled: boolean;
  inkColor?: 'gold' | 'green' | 'purple';
}

export const QuillCursor: React.FC<QuillCursorProps> = ({ enabled, inkColor = 'gold' }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const getInkColors = () => {
    switch (inkColor) {
      case 'green':
        return ['#22c55e', '#4ade80', '#15803d', '#86efac'];
      case 'purple':
        return ['#a855f7', '#c084fc', '#7e22ce', '#e9d5ff'];
      case 'gold':
      default:
        return ['#eab308', '#facc15', '#ca8a04', '#fef08a'];
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Check if device is touch screen only
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      setPos({ x, y });

      const target = e.target as HTMLElement;
      if (target) {
        const isClickable = 
          target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.closest('button') || 
          target.closest('a') ||
          target.classList.contains('cursor-pointer');
        setIsPointer(Boolean(isClickable));
      }

      // Add particle on movement
      const dist = Math.hypot(x - lastPosRef.current.x, y - lastPosRef.current.y);
      if (dist > 6) {
        const colors = getInkColors();
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Spawn 1 to 2 ink particles
        const count = isMouseDown ? 3 : 1;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: x + (Math.random() * 6 - 3),
            y: y + (Math.random() * 6 - 3),
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() * -1.5) - 0.5,
            size: Math.random() * (isMouseDown ? 4.5 : 3) + 1.5,
            alpha: 0.85,
            color,
            rotation: Math.random() * Math.PI * 2,
          });
        }
        lastPosRef.current = { x, y };
      }
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Canvas render loop
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const activeParticles: Particle[] = [];
        for (let p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy -= 0.02; // slow rise like magical vapor
          p.alpha -= 0.022; // fade
          p.size = Math.max(0.2, p.size * 0.98);

          if (p.alpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            activeParticles.push(p);
          }
        }
        particlesRef.current = activeParticles;
      }
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [enabled, inkColor, isMouseDown]);

  if (!enabled) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      />
      {/* The Feather Quill Cursor */}
      <div
        id="magical-feather-quill"
        className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: `translate(-3px, -24px) rotate(${isPointer ? '12deg' : '0deg'}) scale(${isMouseDown ? 0.92 : 1})`,
          filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.75))',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Feather Barbs & Vane */}
          <path
            d="M8 44 C12 36, 18 24, 38 4 C43 1, 46 6, 42 12 C34 26, 22 36, 8 44 Z"
            fill="url(#featherGradient)"
          />
          {/* Feather Details */}
          <path
            d="M38 4 C32 14, 24 24, 12 38"
            stroke="#e5d0a6"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Shaft / Rachis */}
          <path
            d="M40 3 C30 15, 20 28, 6 44"
            stroke="#8c6239"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Golden Ferrule Collar */}
          <rect
            x="4.5"
            y="41"
            width="5"
            height="4"
            transform="rotate(-45 4.5 41)"
            fill="#d4af37"
            stroke="#996515"
            strokeWidth="0.8"
          />
          {/* Metallic Ink Nib Point */}
          <polygon
            points="2,47 6,42 9,45"
            fill="#262626"
            stroke="#d4af37"
            strokeWidth="0.6"
          />
          {/* Glowing Ink droplet on tip */}
          <circle
            cx="2"
            cy="47"
            r="1.8"
            fill={inkColor === 'green' ? '#4ade80' : '#fde047'}
            className="animate-pulse"
          />

          <defs>
            <linearGradient id="featherGradient" x1="42" y1="4" x2="8" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbf6ee" />
              <stop offset="0.4" stopColor="#dfceaf" />
              <stop offset="0.8" stopColor="#967246" />
              <stop offset="1" stopColor="#4a3520" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  );
};
