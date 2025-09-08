'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

type SongItem = { name: string; type: 'be' | 'bn' | 'kj' };

export function SearchBox() {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const router = useRouter();

  // Shortcut "/" untuk membuka pencarian (abaikan saat sedang mengetik di input lain)
  React.useEffect(() => {
    function isEditableTarget(t: EventTarget | null) {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (t.isContentEditable) return true;
      return false;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setQ('');
      setOpen(true);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const goSearch = React.useCallback(() => {
    const query = q.trim();
    if (!query) return;
    setSearching(true);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setTimeout(() => {
      setSearching(false);
      setOpen(false);
    }, 100);
  }, [q, router]);

  return (
  <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
    className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-label="Buka pencarian"
        title="Cari"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 015.364 10.854l3.266 3.266a.75.75 0 11-1.06 1.06l-3.266-3.266A6.75 6.75 0 1110.5 3.75zm0 1.5a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" clipRule="evenodd" />
        </svg>
      </button>

  {open && (
        <SearchPopover
          value={q}
          onChange={setQ}
          onEnter={goSearch}
          onClose={() => setOpen(false)}
          searching={searching}
        />)
      }
    </div>
  );
}

type Suggestion =
  | { kind: 'token'; label: string; apply: string }
  | { kind: 'doc'; label: string; href: string }
  | { kind: 'action'; label: string; onSelect: () => void };

function formatDocHref(book: 'be'|'bn'|'kj', num: string) {
  return `/songs/${book}/${encodeURIComponent(num)}`;
}

function SearchPopover({ value, onChange, onEnter, onClose, searching }:{
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  onClose: () => void;
  searching: boolean;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [songs, setSongs] = React.useState<Record<'be'|'bn'|'kj', Set<string>>>({ be: new Set(), bn: new Set(), kj: new Set() });
  const [activeIndex, setActiveIndex] = React.useState(0);
  const router = useRouter();

  // Muat daftar nomor saat popover dibuka pertama kali
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
  const res = await fetch('/api/songs', { cache: 'no-cache' });
        const data = await res.json();
        if (cancelled) return;
  const be = new Set<string>();
  const bn = new Set<string>();
  const kj = new Set<string>();
        (data.songs as SongItem[]).forEach((s) => {
          if (s.type === 'be') be.add(s.name);
          else if (s.type === 'bn') bn.add(s.name);
          else if (s.type === 'kj') kj.add(s.name);
        });
        setSongs({ be, bn, kj });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // outside & esc
  React.useEffect(() => {
    function handlerDown(e: MouseEvent) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) onClose();
    }
    function handlerKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handlerDown);
    document.addEventListener('keydown', handlerKey);
    setMounted(true);
    return () => {
      document.removeEventListener('mousedown', handlerDown);
      document.removeEventListener('keydown', handlerKey);
    };
  }, [onClose]);

  const suggestions: Suggestion[] = React.useMemo(() => {
    const v = value.trim();
    const items: Suggestion[] = [];

    // 1) Ketik 'b' => sarankan BE/BN/KJ
    if (/^b$/i.test(v)) {
      items.push({ kind: 'token', label: 'BE', apply: 'BE ' });
      items.push({ kind: 'token', label: 'BN', apply: 'BN ' });
      items.push({ kind: 'token', label: 'KJ', apply: 'KJ ' });
      return items;
    }

    // 2) Ketik 'be' / 'bn' => lengkapi dengan spasi
    if (/^(be|bn|kj)$/i.test(v)) {
      const code = v.toUpperCase() as 'BE'|'BN'|'KJ';
      items.push({ kind: 'token', label: `${code}`, apply: `${code} ` });
      return items;
    }

    // 3) Pola 'BE 57' atau 'BN 57' (spasi opsional)
    const m = v.match(/^\s*(be|bn|kj)\s*(\d+)\s*$/i);
    if (m) {
      const book = m[1].toLowerCase() as 'be'|'bn'|'kj';
      const num = m[2];
      if (songs[book].size > 0) {
        // saran eksak, lalu perluas prefix
        if (songs[book].has(num)) {
          items.push({ kind: 'doc', label: `${book.toUpperCase()} ${num}`, href: formatDocHref(book, num) });
        }
        // saran prefix: semua nomor yang diawali num
        const more = [...songs[book]].filter(n => n.startsWith(num)).sort((a,b)=>parseInt(a)-parseInt(b));
        more.forEach(n => {
          // hindari duplikat eksak di atas
          if (n !== num) items.push({ kind: 'doc', label: `${book.toUpperCase()} ${n}`, href: formatDocHref(book, n) });
        });
      }
      // tambahkan opsi cari teks penuh
      items.push({ kind: 'action', label: `Cari "${v}"`, onSelect: onEnter });
      return items;
    }

    // 4) Hanya angka => sarankan nomor tersedia dari BE, BN, KJ
    if (/^\d+$/.test(v)) {
      const digits = v;
      const beMatches = [...songs.be].filter(n => n.startsWith(digits)).sort((a,b)=>parseInt(a)-parseInt(b));
      const bnMatches = [...songs.bn].filter(n => n.startsWith(digits)).sort((a,b)=>parseInt(a)-parseInt(b));
      const kjMatches = [...songs.kj].filter(n => n.startsWith(digits)).sort((a,b)=>parseInt(a)-parseInt(b));
      beMatches.forEach(n => items.push({ kind: 'doc', label: `BE ${n}`, href: formatDocHref('be', n) }));
      bnMatches.forEach(n => items.push({ kind: 'doc', label: `BN ${n}`, href: formatDocHref('bn', n) }));
      kjMatches.forEach(n => items.push({ kind: 'doc', label: `KJ ${n}`, href: formatDocHref('kj', n) }));
      if (items.length === 0 && (songs.be.size === 0 || songs.bn.size === 0)) {
        // data belum termuat sepenuhnya
        items.push({ kind: 'action', label: 'Memuat nomor…', onSelect: () => {} });
      }
      // opsi cepat: buka eksak jika ada di kedua buku
      if (songs.be.has(digits)) items.unshift({ kind: 'doc', label: `BE ${digits}`, href: formatDocHref('be', digits) });
      if (songs.bn.has(digits)) items.splice(1, 0, { kind: 'doc', label: `BN ${digits}`, href: formatDocHref('bn', digits) });
      if (songs.kj.has(digits)) items.splice(2, 0, { kind: 'doc', label: `KJ ${digits}`, href: formatDocHref('kj', digits) });
      items.push({ kind: 'action', label: `Cari "${v}"`, onSelect: onEnter });
      return items;
    }

    // 5) Teks bebas => saran tindakan umum
    if (v.length > 0) {
      // jika diawali huruf b + spasi => sarankan BE/BN
      if (/^b\s*$/i.test(v)) {
        items.push({ kind: 'token', label: 'BE', apply: 'BE ' });
        items.push({ kind: 'token', label: 'BN', apply: 'BN ' });
        items.push({ kind: 'token', label: 'KJ', apply: 'KJ ' });
      }
      items.push({ kind: 'action', label: `Cari "${v}"`, onSelect: onEnter });
    }
    // 6) Default: saran pintasan
    if (items.length === 0) {
      items.push({ kind: 'token', label: 'BE', apply: 'BE ' });
      items.push({ kind: 'token', label: 'BN', apply: 'BN ' });
    }
    return items;
  }, [value, songs, onEnter]);

  // Aksesibilitas & navigasi keyboard pada daftar saran
  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault();
      const s = suggestions[activeIndex];
      if (!s) return onEnter();
      if (s.kind === 'token') onChange(s.apply);
      else if (s.kind === 'doc') router.push(s.href);
      else s.onSelect();
      return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i)=>Math.min(i+1, Math.max(0, suggestions.length-1))); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i)=>Math.max(0, i-1)); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const dir = e.shiftKey ? -1 : 1;
      setActiveIndex((i)=>{
        const next = i + dir;
        if (next < 0) return Math.max(0, suggestions.length - 1);
        if (next >= suggestions.length) return 0;
        return next;
      });
    }
  };

  const listboxId = React.useId();
  return (
  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/30">
      <div
        ref={ref}
  role="dialog"
  aria-modal="true"
  aria-label="Pencarian"
    className="w-full max-w-md rounded-md glass-panel shadow-lg grid grid-rows-[auto,1fr,auto] text-white"
      >
        <div className="p-3 border-b border-white/10">
        <input
          autoFocus
          type="search"
          value={value}
          onChange={(e) => { onChange(e.target.value); setActiveIndex(0); }}
          onKeyDown={onKeyDownInput}
          placeholder={loading ? 'Memuat nomor…' : 'Ketik nomor (mis. 57), BE/BN, atau kata kunci'}
          className="w-full p-2 rounded-md border border-white/20 bg-white/10 text-sm placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Ketik kata yang ingin dicari"
        />
      </div>

  <div id={listboxId} className="max-h-64 overflow-y-auto divide-y divide-white/10">
        {suggestions.map((s, idx) => (
          <SuggestionRow key={idx} id={`${listboxId}-opt-${idx}`} s={s} query={value} active={idx===activeIndex} onHover={() => setActiveIndex(idx)} onApply={() => {
            if (s.kind === 'token') onChange(s.apply);
            else if (s.kind === 'doc') router.push(s.href);
            else s.onSelect();
          }} />
        ))}
        {(!mounted || suggestions.length === 0) && (
          <div
            id={`${listboxId}-opt-empty`}
            className="px-3 py-3 text-sm text-white/70"
          >
            Tidak ada saran
          </div>
        )}
      </div>

  <div className="sticky bottom-0 glass-panel px-3 py-2 flex items-center justify-between gap-2 border-t border-white/10">
          <span className="text-xs text-white/70">Esc untuk menutup</span>
        <div className="flex items-center gap-2">
          <a
            href={`/search?q=${encodeURIComponent(value)}`}
              className="px-3 py-1.5 text-sm rounded-md border border-white/20 hover:bg-white/10"
          >
            Lihat semua hasil
          </a>
            <button onClick={onEnter} className="px-3 py-1.5 text-sm rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-60" disabled={searching}>
            {searching ? 'Mencari…' : 'Cari'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

function SuggestionRow({ s, active, id, query, onHover, onApply }:{ s: Suggestion; active: boolean; id: string; query: string; onHover: () => void; onApply: () => void }) {
  const base = "cursor-pointer px-3 py-2 text-sm flex items-center gap-2";
  const activeCls = active ? 'bg-white/10' : 'hover:bg-white/5';
  const label = s.label;
  const q = query.trim();
  function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function renderHighlighted(text: string) {
    if (!q) return <span className="text-white">{text}</span>;
    const tokens = Array.from(new Set(q.split(/\s+/).filter(Boolean)));
    if (tokens.length === 0) return <span className="text-white">{text}</span>;
    const re = new RegExp(`(${tokens.map(escapeRegex).join('|')})`, 'gi');
    const parts = text.split(re);
    return (
      <span className="text-white">
        {parts.map((part, i) =>
          re.test(part) ? (
            <mark key={i} className="bg-yellow-300/40 text-inherit rounded px-0.5">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  }
  if (s.kind === 'doc') {
    return (
      <div id={id} className={`${base} ${activeCls}`} onMouseEnter={onHover} onClick={onApply}>
        <span className="inline-flex items-center justify-center rounded bg-white/20 text-xs px-1.5 py-0.5">Dok</span>
        {renderHighlighted(label)}
      </div>
    );
  }
  if (s.kind === 'token') {
    return (
      <div id={id} className={`${base} ${activeCls}`} onMouseEnter={onHover} onClick={onApply}>
        <span className="inline-flex items-center justify-center rounded bg-white/20 text-xs px-1.5 py-0.5">Pintasan</span>
        {renderHighlighted(label)}
      </div>
    );
  }
  return (
    <div id={id} className={`${base} ${activeCls}`} onMouseEnter={onHover} onClick={onApply}>
      <span className="inline-flex items-center justify-center rounded bg-white/20 text-xs px-1.5 py-0.5">Aksi</span>
      {renderHighlighted(label)}
    </div>
  );
}
