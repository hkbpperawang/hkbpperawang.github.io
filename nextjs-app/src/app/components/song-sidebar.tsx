'use client';

import * as React from 'react';
import { QuickNavigator } from '@/app/components/quick-navigator';

export function SongSidebar({ type }: { type: 'be'|'bn' }) {
  const [open, setOpen] = React.useState(false);
  const [book, setBook] = React.useState<'be'|'bn'>(type);
  return (
    <div className="relative">
      <button
        className="md:hidden inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-brand-border-strong bg-white dark:bg-brand-surface px-3 py-2 text-sm"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3.75 6.75a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 10.5a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0-5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd"/></svg>
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-brand-surface border-r border-slate-200 dark:border-brand-border shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Navigasi</h2>
              <button className="rounded p-2 hover:bg-slate-100 dark:hover:bg-brand-hover" onClick={() => setOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="sidebar-book" className="block text-sm mb-1">Pilih Buku</label>
                <select
                  id="sidebar-book"
                  value={book}
                  onChange={(e)=>setBook(e.target.value as 'be'|'bn')}
                  className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-brand-border-strong bg-white dark:bg-brand-surface"
                >
                  <option value="be">BE</option>
                  <option value="bn">BN</option>
                </select>
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
