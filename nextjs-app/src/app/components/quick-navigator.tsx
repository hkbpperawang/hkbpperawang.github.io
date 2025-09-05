'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';

type Song = { name: string; type: 'be' | 'bn' };

type QuickNavigatorProps = {
  mode?: 'floating' | 'inline';
  book?: 'be' | 'bn'; // controlled
  onBookChange?: (b: 'be'|'bn') => void;
  showBookSelect?: boolean;
  className?: string;
};

export function QuickNavigator({
  mode = 'inline',
  book: controlledBook,
  onBookChange,
  showBookSelect = true,
  className,
}: QuickNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = React.useState(true);
  const [bookState, setBookState] = React.useState<'be' | 'bn'>(() => {
    const m = pathname?.match(/\/songs\/(be|bn)\//);
    return (m?.[1] as 'be' | 'bn') ?? 'be';
  });
  const book = controlledBook ?? bookState;

  const [input, setInput] = React.useState('');
  const [songs, setSongs] = React.useState<Record<'be'|'bn', string[]>>({ be: [], bn: [] });
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Ambil daftar nomor dari API (sudah di-cache CDN)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/songs');
        const data = await res.json();
        if (!mounted) return;
        const grouped: Record<'be'|'bn', string[]> = { be: [], bn: [] };
        (data.songs as Song[]).forEach((s) => {
          if (s.type === 'be' || s.type === 'bn') grouped[s.type].push(s.name);
        });
        grouped.be.sort((a,b)=>parseInt(a)-parseInt(b));
        grouped.bn.sort((a,b)=>parseInt(a)-parseInt(b));
        setSongs(grouped);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const list = songs[book];
  const suggestions = React.useMemo(() => {
    if (!input) return list.slice(0, 8);
    const q = input.trim();
    return list.filter(n => n.startsWith(q)).slice(0, 8);
  }, [input, list]);

  const go = React.useCallback((value?: string) => {
    const v = (value ?? input).trim();
    if (!v) return;
    setOpen(false);
    router.push(`/songs/${book}/${encodeURIComponent(v)}`);
  }, [book, input, router]);

  // Tutup dropdown saran saat klik di luar atau tekan ESC
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (!panelRef.current.contains(target)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Enter' && open) go();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, go]);

  return (
    <div ref={panelRef} className={`relative ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        {showBookSelect ? (
          <select
            value={book}
            onChange={(e) => {
              const val = e.target.value as 'be'|'bn';
              if (onBookChange) onBookChange(val); else setBookState(val);
              // fokuskan kembali ke input agar ready ketik
              setTimeout(()=>inputRef.current?.focus(), 0);
            }}
            className="px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            aria-label="Pilih buku"
          >
            <option value="be">BE</option>
            <option value="bn">BN</option>
          </select>
        ) : null}

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          spellCheck={false}
          aria-expanded={open}
          placeholder={loading ? 'Memuat…' : `Nomor ${book.toUpperCase()}…`}
          className="w-40 md:w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600
                     dark:bg-slate-900 dark:text-slate-100"
          value={input}
          onChange={(e) => { setInput(e.target.value.replace(/[^\d]/g, '')); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
        />

        <button
          type="button"
          onClick={() => go()}
          className="rounded-md bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700
                     focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          Go
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Saran nomor"
          className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-slate-200
                     bg-white shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900
                     animate-fade-in-up"
          // Cegah blur input saat interaksi dropdown
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((num) => (
            <div
              key={num}
              role="option"
              tabIndex={-1}
              className="cursor-pointer px-3 py-2 text-sm text-slate-800 hover:bg-slate-100
                         dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                setOpen(false);
                go(String(num));
              }}
            >
              {book.toUpperCase()} {num}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
