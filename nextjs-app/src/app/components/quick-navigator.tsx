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

export function QuickNavigator({ mode = 'floating', book: controlledBook, onBookChange, showBookSelect = true, className }: QuickNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(true);
  const [bookState, setBookState] = React.useState<'be' | 'bn'>(() => {
    // Deteksi dari URL bila mungkin
    const m = pathname?.match(/\/songs\/(be|bn)\//);
    return (m?.[1] as 'be' | 'bn') ?? 'be';
  });
  const book = controlledBook ?? bookState;
  const [input, setInput] = React.useState('');
  const [songs, setSongs] = React.useState<Record<'be'|'bn', string[]>>({ be: [], bn: [] });
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

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
    if (!input) return list.slice(0, 10);
    const q = input.trim();
    return list.filter(n => n.startsWith(q)).slice(0, 10);
  }, [input, list]);

  const go = React.useCallback((value?: string) => {
    const v = (value ?? input).trim();
    if (!v) return;
    setOpen(false);
    router.push(`/songs/${book}/${encodeURIComponent(v)}`);
  }, [book, input, router]);

  // close on outside click / esc
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
  }, [open, book, input, go]);

  const Container = ({ children }: { children: React.ReactNode }) => (
    mode === 'floating' ? (
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-30">
        <div ref={panelRef} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg p-2 md:p-3 flex items-center gap-2">
          {children}
        </div>
      </div>
    ) : (
      <div ref={panelRef} className={"relative flex items-center gap-2 w-full " + (className ?? '')}>
        {children}
      </div>
    )
  );

  const BookSelect = showBookSelect ? (
    <select
      value={book}
      onChange={(e) => {
        const val = e.target.value as 'be'|'bn';
        if (onBookChange) onBookChange(val); else setBookState(val);
        setTimeout(()=>inputRef.current?.focus(), 0);
      }}
      className="px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
      aria-label="Pilih buku"
    >
      <option value="be">BE</option>
      <option value="bn">BN</option>
    </select>
  ) : null;

  return (
    <Container>
      {BookSelect}

    <div className="relative flex-1">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onFocus={(e) => { setOpen(true); e.currentTarget.select(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
            placeholder={loading ? 'Memuat...' : `Nomor ${book.toUpperCase()}…`}
            inputMode="numeric"
            pattern="[0-9]*"
            spellCheck={false}
      className={(mode === 'inline' ? 'w-full md:w-40 ' : 'w-28 md:w-40 ') + "px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"}
            aria-label="Ketik nomor lagu lalu Enter"
          />
          {open && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow animate-fade-in-up">
              {suggestions.map((s) => (
                <button key={s} onClick={() => go(s)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => go()}
          className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
          aria-label="Buka lagu"
        >
          <span className="hidden md:inline">Go</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:hidden">
            <path d="M13.5 4.5l6 7.5-6 7.5m-9-15h9"/>
          </svg>
        </button>
    </Container>
  );
}
