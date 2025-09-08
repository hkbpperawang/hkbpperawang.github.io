"use client";

import * as React from 'react';

type LyricsZoomProps = {
  children: React.ReactNode;
  className?: string;
  min?: number;
  max?: number;
  persist?: boolean; // simpan skala di localStorage
};

export function LyricsZoom({ children, className, min = 0.8, max = 2.0, persist = true }: LyricsZoomProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);

  // Pulihkan skala dari localStorage
  React.useEffect(() => {
    if (!persist) return;
    try {
      const v = localStorage.getItem('lyricsScale');
      if (v) setScale(() => {
        const s = parseFloat(v);
        return isNaN(s) ? 1 : Math.min(max, Math.max(min, s));
      });
    } catch {}
  }, [min, max, persist]);

  // Simpan saat berubah
  React.useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem('lyricsScale', String(scale)); } catch {}
  }, [scale, persist]);

  // Pinch handler (touch events untuk Safari + Pointer Events untuk browser lain)
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let initialDistance = 0;
    let startScale = scale;

    function getDistance(touches: TouchList) {
      const [a, b] = [touches.item(0), touches.item(1)];
      if (!a || !b) return 0;
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    }

  const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
        startScale = scale;
      }
    };

  const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Cegah page-zoom saat pinch di area lirik
        e.preventDefault();
        const d = getDistance(e.touches);
        if (initialDistance > 0 && d > 0) {
          const factor = d / initialDistance;
          const next = Math.min(max, Math.max(min, startScale * factor));
          setScale(next);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Ctrl + scroll untuk aksesibilitas di desktop
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY;
        const step = -delta / 1000; // kecil agar halus
        const next = Math.min(max, Math.max(min, scale + step));
        setScale(next);
      }
    };

    // Pasang listener non-passive untuk bisa preventDefault
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart, { passive: false } as AddEventListenerOptions);
      el.removeEventListener('touchmove', onTouchMove, { passive: false } as AddEventListenerOptions);
      el.removeEventListener('wheel', onWheel, { passive: false } as AddEventListenerOptions);
    };
  }, [scale, min, max]);

  // Update CSS variable tanpa inline style pada JSX
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--lyrics-scale', String(scale));
  }, [scale]);

  return (
    <div ref={ref} className={className ? `lyrics-root ${className}` : 'lyrics-root'}>
      {children}
    </div>
  );
}
