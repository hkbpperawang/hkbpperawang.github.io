'use client';

import * as React from 'react';
import { QuickNavigator } from '@/app/components/quick-navigator';
import { BookSelect } from '@/app/components/ui/book-select';

export function SongSidebar({ type }: { type: 'be'|'bn'|'kj' }) {
  const [open, setOpen] = React.useState(false);
  const [book, setBook] = React.useState<'be'|'bn'|'kj'>(type);
  return (
    <div className="relative">
      <button
        className="lg:hidden ml-auto inline-flex items-center gap-2 rounded-md glass-button px-3 py-2 text-sm"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3.75 6.75a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 10.5a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0-5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd"/></svg>
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 glass-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
    <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] glass-panel border-r border-white/15 shadow-xl p-4 overflow-y-auto text-white animate-slide-in-left">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Navigasi</h2>
              <button className="rounded p-2 hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="sidebar-book" className="block text-sm mb-1">Pilih Buku</label>
                <BookSelect id="sidebar-book" value={book} onChange={(v)=>setBook(v)} className="w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Loncat Ke Nomor</label>
                <QuickNavigator mode="inline" book={book} showBookSelect={false} className="w-full" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
