'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Tetris sederhana 10x20 dengan kontrol sentuh/klik
type Cell = 0 | 1;
type Grid = Cell[][];

const COLS = 10;
const ROWS = 20;

const SHAPES: number[][][] = [
  [[1,1,1,1]], // I
  [[1,0,0],[1,1,1]], // J
  [[0,0,1],[1,1,1]], // L
  [[1,1],[1,1]],     // O
  [[0,1,1],[1,1,0]], // S
  [[0,1,0],[1,1,1]], // T
  [[1,1,0],[0,1,1]], // Z
];

function rotate(shape: number[][]) {
  const rows = shape.length, cols = shape[0].length;
  const out: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = shape[r][c];
  return out;
}

function randomShape() { return SHAPES[Math.floor(Math.random() * SHAPES.length)].map(r => [...r]); }

export default function NotFoundPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<Grid>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [shape, setShape] = useState<number[][]>(randomShape());
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 3, y: 0 });
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [cell, setCell] = useState<number>(36); // responsive size
  const [lines, setLines] = useState(0);
  const [speedMs, setSpeedMs] = useState(600);

  // Responsive cell size
  useEffect(() => {
    const compute = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      setCell(w < 640 ? 28 : w < 1024 ? 32 : 36);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Draw board and current shape
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = COLS * cell; canvas.height = ROWS * cell;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const draw = (x: number, y: number, color: string) => {
      ctx.fillStyle = color; ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    };
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) draw(c, r, '#38bdf8');
    for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[0].length; c++) if (shape[r][c]) draw(pos.x + c, pos.y + r, '#22c55e');
  }, [grid, shape, pos, cell]);

  const collides = useCallback((nx: number, ny: number, sh = shape) => {
    for (let r = 0; r < sh.length; r++) for (let c = 0; c < sh[0].length; c++) if (sh[r][c]) {
      const x = nx + c, y = ny + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && grid[y][x]) return true;
    }
    return false;
  }, [grid, shape]);

  const lockAndClear = useCallback(() => {
    const nextGrid = grid.map(row => [...row]);
    // Merge current piece
    for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[0].length; c++) if (shape[r][c]) {
      const x = pos.x + c, y = pos.y + r; if (y >= 0) nextGrid[y][x] = 1;
    }
    // Game over if top row has blocks
    if (nextGrid[0].some(v => v === 1)) {
      setGrid(nextGrid); setRunning(false); setGameOver(true); return;
    }
    // Clear lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nextGrid[r].every(v => v === 1)) { nextGrid.splice(r, 1); nextGrid.unshift(Array(COLS).fill(0)); cleared++; r++; }
    }
    if (cleared) { setScore(s => s + (cleared === 1 ? 100 : cleared === 2 ? 250 : cleared === 3 ? 400 : 600)); setLines(l => l + cleared); }
    setGrid(nextGrid);
    // Spawn new
    const next = randomShape(); setShape(next); setPos({ x: 3, y: 0 });
    if (collides(3, 0, next)) { setRunning(false); setGameOver(true); }
  }, [grid, shape, pos, collides]);

  // Gravity loop
  useEffect(() => {
    if (!running || paused) return;
    const t = setInterval(() => {
      setPos(p => {
        const ny = p.y + 1;
        if (collides(p.x, ny)) { lockAndClear(); return p; }
        return { ...p, y: ny };
      });
    }, speedMs);
    return () => clearInterval(t);
  }, [running, paused, speedMs, collides, lockAndClear]);

  // Increase speed by lines cleared
  useEffect(() => { setSpeedMs(lines >= 20 ? 320 : lines >= 12 ? 420 : lines >= 6 ? 520 : 600); }, [lines]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running) return;
      if (e.key === 'ArrowLeft') setPos(p => !collides(p.x - 1, p.y) ? { ...p, x: p.x - 1 } : p);
      if (e.key === 'ArrowRight') setPos(p => !collides(p.x + 1, p.y) ? { ...p, x: p.x + 1 } : p);
      if (e.key === 'ArrowDown') setPos(p => !collides(p.x, p.y + 1) ? { ...p, y: p.y + 1 } : p);
      if (e.key === 'ArrowUp' || e.key === ' ') { const rot = rotate(shape); if (!collides(pos.x, pos.y, rot)) setShape(rot); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, shape, pos, collides]);

  // Touch drag left/right & soft drop
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    let sx = 0, sy = 0;
    const start = (e: TouchEvent) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; };
    const move = (e: TouchEvent) => {
      if (!sx) return; const t = e.touches[0];
      const dx = t.clientX - sx; const dy = t.clientY - sy;
      if (Math.abs(dx) > 20) { setPos(p => !collides(p.x + (dx > 0 ? 1 : -1), p.y) ? { ...p, x: p.x + (dx > 0 ? 1 : -1) } : p); sx = t.clientX; }
      if (dy > 24) { setPos(p => !collides(p.x, p.y + 1) ? { ...p, y: p.y + 1 } : p); sy = t.clientY; }
    };
    const end = () => { sx = 0; sy = 0; };
    el.addEventListener('touchstart', start); el.addEventListener('touchmove', move); el.addEventListener('touchend', end);
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); };
  }, [collides]);

  const startGame = () => {
    setStarted(true); setPaused(false); setGameOver(false);
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setShape(randomShape()); setPos({ x: 3, y: 0 }); setScore(0); setLines(0); setSpeedMs(600); setRunning(true);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-brand-base text-slate-900 dark:text-slate-100 flex flex-col items-center">
      <div className="max-w-3xl w-full px-4 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold">404 - Halaman tidak ditemukan</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Sambil menunggu, mainkan Tetris mini di bawah ini.</p>
        <div className="mt-6 inline-flex flex-wrap gap-4 justify-center">
          <Link href="/" className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700">Kembali ke Beranda</Link>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          onClick={() => { if (!running || paused) return; const rot = rotate(shape); if (!collides(pos.x, pos.y, rot)) setShape(rot); }}
          className="rounded-md border border-slate-200 dark:border-brand-border shadow touch-none"
        />

        <div className="flex items-center gap-4">
          <button aria-label="Kiri" className="px-4 py-3 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={() => setPos(p => !collides(p.x - 1, p.y) ? { ...p, x: p.x - 1 } : p)}>◀</button>
          <button aria-label="Putar" className="px-4 py-3 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={() => { const rot = rotate(shape); if (!collides(pos.x, pos.y, rot)) setShape(rot); }}>⟳</button>
          <button aria-label="Turun" className="px-4 py-3 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={() => setPos(p => !collides(p.x, p.y + 1) ? { ...p, y: p.y + 1 } : p)}>▼</button>
          <button aria-label="Kanan" className="px-4 py-3 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={() => setPos(p => !collides(p.x + 1, p.y) ? { ...p, x: p.x + 1 } : p)}>▶</button>
          <button aria-label={paused ? 'Lanjut' : 'Jeda'} className="px-4 py-3 rounded bg-slate-800 text-white/90 hover:bg-slate-700" onClick={() => setPaused(p => !p)}>{paused ? 'Lanjut' : 'Jeda'}</button>
        </div>

        {/* Center overlay for Start and Game Over */}
        {(!started || gameOver) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm text-center rounded-md glass-panel-strong border border-white/15 text-white px-5 py-5">
              {!started && !gameOver && (<div className="text-xl font-bold">Mulai Permainan</div>)}
              {gameOver && (
                <div>
                  <div className="text-2xl font-extrabold">Game Over</div>
                  <div className="text-white/80 mt-1">Skor: {score}</div>
                </div>
              )}
              <div className="mt-4">
                <button onClick={startGame} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700">{gameOver ? 'Mulai Lagi' : 'Mulai'}</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Skor: {score}</div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          <div className="font-medium">Panduan bermain dengan sentuhan:</div>
          <div>1. Bisa memindahkan blok dengan menarik langsung</div>
          <div>2. Untuk rotasi blok tekan 1x pada blok</div>
        </div>
      </div>
      <div className="h-10" />
    </main>
  );
}

