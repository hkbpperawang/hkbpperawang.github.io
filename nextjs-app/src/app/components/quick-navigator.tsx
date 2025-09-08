'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';

type Song = { name: string; type: 'be' | 'bn' | 'kj' };

type QuickNavigatorProps = {
  mode?: 'floating' | 'inline';
  book?: 'be' | 'bn' | 'kj';
  onBookChange?: (b: 'be'|'bn'|'kj') => void;
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
  const [bookState, setBookState] = React.useState<'be' | 'bn' | 'kj'>(() => {
    const m = pathname?.match(/\/songs\/(be|bn|kj)(?:\/(?:$|\d+))?/);
    return (m?.[1] as 'be' | 'bn' | 'kj') ?? 'be';
  });
  const book = controlledBook ?? bookState;

  const [input, setInput] = React.useState('');
  const [songs, setSongs] = React.useState<Record<'be'|'bn'|'kj', string[]>>({ be: [], bn: [], kj: [] });
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listboxId = React.useId();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
  const res = await fetch('/api/songs', { cache: 'no-cache' });
        const data = await res.json();
        if (!mounted) return;
        const grouped: Record<'be'|'bn'|'kj', string[]> = { be: [], bn: [], kj: [] };
        (data.songs as Song[]).forEach((s) => {
          if (s.type === 'be' || s.type === 'bn' || s.type === 'kj') grouped[s.type].push(s.name);
        });
        grouped.be.sort((a,b)=>parseInt(a)-parseInt(b));
        grouped.bn.sort((a,b)=>parseInt(a)-parseInt(b));
        grouped.kj.sort((a,b)=>parseInt(a)-parseInt(b));
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

  React.useEffect(() => { setActiveIndex(0); }, [open, input, book]);

  return (
    <div ref={panelRef} className={`relative ${className ?? ''}`} data-mode={mode}>
      <div className="flex items-center gap-2">
        {showBookSelect ? (
          <select
            value={book}
            onChange={(e) => {
              const val = e.target.value as 'be'|'bn'|'kj';
              if (onBookChange) onBookChange(val); else setBookState(val);
              setTimeout(()=>inputRef.current?.focus(), 0);
            }}
            className="px-2 py-1.5 text-sm rounded-md border border-white/20 bg-white/10 text-white"
            aria-label="Pilih buku"
          >
            <option value="be">BE</option>
            <option value="bn">BN</option>
            <option value="kj">KJ</option>
          </select>
        ) : null}

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          spellCheck={false}
          placeholder={loading ? 'Memuat…' : `Nomor ${book.toUpperCase()}…`}
          className="w-40 md:w-48 rounded-md glass-input placeholder-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
          value={input}
          onChange={(e) => { setInput(e.target.value.replace(/[^\d]/g, '')); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (open && suggestions.length > 0) {
                go(String(suggestions[activeIndex]));
              } else {
                go();
              }
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((i) => Math.min(i + 1, Math.max(0, suggestions.length - 1)));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            }
            if (e.key === 'Escape') setOpen(false);
          }}
        />

        <button
          type="button"
          onClick={() => go()}
          className="rounded-md bg-white/20 hover:bg-white/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Go
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div
          id={listboxId}
  className="absolute left-0 top-full z-50 mt-1 w-full rounded-md glass-panel shadow-lg animate-fade-in-up"

          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((num, idx) => (
            <div
              key={num}
              id={`${listboxId}-opt-${idx}`}
        className={`cursor-pointer px-3 py-2 text-sm text-white hover:bg-white/10 ${activeIndex === idx ? 'bg-white/10' : ''}`}
              onMouseEnter={() => setActiveIndex(idx)}
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
