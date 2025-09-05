'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBox() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  const go = () => {
    const query = q.trim();
    if (!query) return;
    setSearching(true);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    // kecilkan delay agar status sempat terlihat
    setTimeout(() => { setSearching(false); setOpen(false); }, 150);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          onEnter={go}
          onClose={() => setOpen(false)}
          searching={searching}
        />
      )}
    </div>
  );
}

function SearchPopover({ value, onChange, onEnter, onClose, searching }:{
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  onClose: () => void;
  searching: boolean;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
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
    return () => {
      document.removeEventListener('mousedown', handlerDown);
      document.removeEventListener('keydown', handlerKey);
    };
  }, [onClose]);

  return (
  <div ref={ref} className="absolute right-0 mt-2 w-72 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50">
      <input
        autoFocus
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
        placeholder="Ketik kata lalu Enter"
        className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Ketik kata yang ingin dicari"
      />
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">Tekan Esc untuk menutup</span>
        <div className="flex items-center gap-2">
          <a
            href={`/search?q=${encodeURIComponent(value)}`}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Lihat semua hasil
          </a>
          <button onClick={onEnter} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" disabled={searching}>
            {searching ? 'Mencari…' : 'Cari'}
          </button>
        </div>
      </div>
    </div>
  );
}
