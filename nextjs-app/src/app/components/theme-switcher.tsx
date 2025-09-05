'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md
                 hover:bg-slate-200/50 dark:hover:bg-brand-hover/60
                 focus:outline-none focus:ring-2 focus:ring-sky-500"
    >
      {/* ikon sederhana */}
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" className="fill-slate-100">
          <path d="M12 3a1 1 0 011 1v2a1 1 0 11-2 0V4a1 1 0 011-1zm0 14a4 4 0 100-8 4 4 0 000 8zm8-5a1 1 0 010 2h-2a1 1 0 110-2h2zM7 12a1 1 0 01-1 1H4a1 1 0 110-2h2a1 1 0 011 1zm10.657 6.657a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM6.757 6.757a1 1 0 01-1.414 0L3.929 5.343A1 1 0 015.343 3.93l1.414 1.414a1 1 0 010 1.414zM18.657 5.343A1 1 0 0020.07 3.93l1.415 1.414a1 1 0 11-1.415 1.414l-1.414-1.414zM5.343 18.657a1 1 0 00-1.414 1.415L5.343 21.485A1 1 0 106.757 20.07L5.343 18.657z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" className="fill-slate-800">
          <path d="M21.64 13a9 9 0 11-10.63-10.63 1 1 0 00.9 1.45 7 7 0 109.28 9.28 1 1 0 001.45.9z"/>
        </svg>
      )}
    </button>
  );
}
