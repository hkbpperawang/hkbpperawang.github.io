'use client';

import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function setTheme(next: 'light' | 'dark') {
    const root = document.documentElement;
    const isDark = next === 'dark';
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', next);
  }

  function toggle() {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  }

  if (!mounted) return null;

  return (
    <button
      type="button"
      aria-label="Toggle tema"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md
                 hover:bg-slate-200/50 dark:hover:bg-slate-800/60
                 focus:outline-none focus:ring-2 focus:ring-sky-500"
    >
      {/* ikon sederhana */}
      <svg width="18" height="18" viewBox="0 0 24 24" className="fill-slate-800 dark:fill-slate-100">
        <path d="M21.64 13a9 9 0 11-10.63-10.63 1 1 0 00.9 1.45 7 7 0 109.28 9.28 1 1 0 001.45.9z"/>
      </svg>
    </button>
  );
}
