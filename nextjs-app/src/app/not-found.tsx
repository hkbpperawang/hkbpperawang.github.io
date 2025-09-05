'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Tetris sederhana: grid 10x20, kanvas + kontrol tombol & sentuh
type Cell = 0 | 1;
type Grid = Cell[][];

const COLS = 10;
const ROWS = 20;
const SIZE = 24; // px per sel

const SHAPES = [
  // I, J, L, O, S, T, Z
  [[1,1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1],[1,1]],
  [[0,1,1],[1,1,0]],
  [[0,1,0],[1,1,1]],
  [[1,1,0],[0,1,1]],
] as number[][][];

function rotate(shape: number[][]) {
  const rows = shape.length, cols = shape[0].length;
  const out: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = shape[r][c];
  return out;
}

function randomShape() { return SHAPES[Math.floor(Math.random()*SHAPES.length)].map(r=>[...r]); }

export default function NotFoundPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<Grid>(() => Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [shape, setShape] = useState<number[][]>(randomShape());
  const [pos, setPos] = useState<{x:number;y:number}>({ x: 3, y: 0 });
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);

  // Gambar
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = COLS * SIZE; canvas.height = ROWS * SIZE;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    const drawCell = (x:number,y:number,color:string) => {
      ctx.fillStyle = color; ctx.fillRect(x*SIZE+1,y*SIZE+1,SIZE-2,SIZE-2);
    };
    // settled
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (grid[r][c]) drawCell(c,r,'#38bdf8');
    // current
    for (let r=0;r<shape.length;r++) for (let c=0;c<shape[0].length;c++) if (shape[r][c]) drawCell(pos.x+c,pos.y+r,'#22c55e');
  }, [grid, shape, pos]);

  // Collision check
  const collides = useCallback((nx:number, ny:number, sh=shape) => {
    for (let r=0;r<sh.length;r++) for (let c=0;c<sh[0].length;c++) if (sh[r][c]) {
      const x = nx + c, y = ny + r;
      if (x<0 || x>=COLS || y>=ROWS) return true;
      if (y>=0 && grid[y][x]) return true;
    }
    return false;
  }, [grid, shape]);

  // Merge shape ke grid, hapus baris penuh
  const lockAndClear = useCallback(() => {
    const newGrid = grid.map(row=>[...row]);
    for (let r=0;r<shape.length;r++) for (let c=0;c<shape[0].length;c++) if (shape[r][c]) {
      const x = pos.x + c, y = pos.y + r; if (y>=0) newGrid[y][x] = 1;
    }
    // clear lines
    let cleared = 0;
    for (let r=ROWS-1;r>=0;r--) {
      if (newGrid[r].every(v=>v===1)) { newGrid.splice(r,1); newGrid.unshift(Array(COLS).fill(0)); cleared++; r++; }
    }
    if (cleared) setScore(s=>s + (cleared===1?100:cleared===2?250:cleared===3?400:600));
    setGrid(newGrid);
    const next = randomShape(); setShape(next); setPos({ x: 3, y: 0 });
    if (collides(3,0,next)) setRunning(false);
  }, [grid, shape, pos, collides]);

  // Gravity loop
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setPos(p => {
        const ny = p.y + 1;
        if (collides(p.x, ny)) { lockAndClear(); return p; }
        return { ...p, y: ny };
      });
    }, 600);
    return () => clearInterval(t);
  }, [running, grid, shape, lockAndClear, collides]);

  // Controls: keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running) return;
      if (e.key === 'ArrowLeft') setPos(p => !collides(p.x-1,p.y) ? { ...p, x: p.x-1 } : p);
      if (e.key === 'ArrowRight') setPos(p => !collides(p.x+1,p.y) ? { ...p, x: p.x+1 } : p);
      if (e.key === 'ArrowDown') setPos(p => !collides(p.x,p.y+1) ? { ...p, y: p.y+1 } : p);
      if (e.key === 'ArrowUp' || e.key === ' ') {
        const rot = rotate(shape); if (!collides(pos.x,pos.y,rot)) setShape(rot);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, shape, pos, collides]);

  // Controls: tap/swipe sederhana
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    let sx=0, sy=0;
    const start = (e: TouchEvent) => { const t=e.touches[0]; sx=t.clientX; sy=t.clientY; };
    const move = (e: TouchEvent) => { if (!sx) return; const t=e.touches[0]; const dx=t.clientX-sx; const dy=t.clientY-sy; if (Math.abs(dx)>24) { setPos(p=>!collides(p.x+(dx>0?1:-1),p.y)?{...p,x:p.x+(dx>0?1:-1)}:p); sx=t.clientX; } if (dy>24) { setPos(p=>!collides(p.x,p.y+1)?{...p,y:p.y+1}:p); sy=t.clientY; } };
    const end = () => { sx=0; sy=0; };
    el.addEventListener('touchstart', start); el.addEventListener('touchmove', move); el.addEventListener('touchend', end);
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); };
  }, [collides]);

  return (
  <main className="min-h-screen bg-gray-50 dark:bg-brand-base text-slate-900 dark:text-slate-100 flex flex-col items-center">
      <div className="max-w-3xl w-full px-4 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold">404 — Halaman tidak ditemukan</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Sambil menunggu, mainkan Tetris mini di bawah ini.</p>
        <div className="mt-6 inline-flex gap-3">
          <Link href="/" className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700">Kembali ke Beranda</Link>
          <button onClick={()=>{setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0))); setShape(randomShape()); setPos({x:3,y:0}); setRunning(true); setScore(0);}} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Mulai Ulang</button>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
  <canvas ref={canvasRef} className="rounded-md border border-slate-200 dark:border-brand-border shadow touch-none" />

        <div className="flex items-center gap-2">
          <button aria-label="Kiri" className="px-3 py-2 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={()=>setPos(p=>!collides(p.x-1,p.y)?{...p,x:p.x-1}:p)}>◀</button>
          <button aria-label="Putar" className="px-3 py-2 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={()=>{const rot=rotate(shape); if(!collides(pos.x,pos.y,rot)) setShape(rot);}}>⟳</button>
          <button aria-label="Turun" className="px-3 py-2 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={()=>setPos(p=>!collides(p.x,p.y+1)?{...p,y:p.y+1}:p)}>▼</button>
          <button aria-label="Kanan" className="px-3 py-2 rounded bg-slate-200 dark:bg-brand-surface hover:bg-slate-300 dark:hover:bg-brand-hover" onClick={()=>setPos(p=>!collides(p.x+1,p.y)?{...p,x:p.x+1}:p)}>▶</button>
        </div>

        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Skor: {score}</div>
      </div>
      <div className="h-10" />
    </main>
  );
}
