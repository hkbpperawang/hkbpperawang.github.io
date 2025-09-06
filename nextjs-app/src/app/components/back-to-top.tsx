'use client';

import * as React from 'react';

export function BackToTop() {
  const [visible, setVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const threshold = 240; // px
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        try {
          const y = window.scrollY || document.documentElement.scrollTop || 0;
          setVisible(y > threshold);
        } catch {
          // noop: gagal membaca posisi scroll
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // inisialisasi status awal
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!mounted) return null;

  const handleClick = () => {
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } catch {
      // fallback: set manual jika API tidak tersedia
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  return (
  <button
      type="button"
      aria-label="Kembali ke atas"
      onClick={handleClick}
      className={`fixed right-4 bottom-4 md:right-6 md:bottom-6 z-40 h-11 w-11 md:h-12 md:w-12 rounded-full shadow-lg border
                  bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300/90
                  dark:bg-brand-surface/90 dark:text-slate-100 dark:border-brand-border dark:hover:bg-brand-hover/80
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 pb-safe-bottom
          transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}
    >
      {/* Ikon panah ke atas */}
      <svg width="22" height="22" viewBox="0 0 24 24" className="mx-auto" aria-hidden="true">
        <path fill="currentColor" d="M12 5l7 7-1.41 1.41L13 10.83V20h-2v-9.17l-4.59 4.58L5 12z" />
      </svg>
    </button>
  );
}
