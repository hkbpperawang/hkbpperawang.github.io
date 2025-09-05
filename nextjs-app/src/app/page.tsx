
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuickNavigator } from '@/app/components/quick-navigator';

// Interface for song data
interface Song { name: string; path: string; type: string }
interface TitleItem { name: string; type: 'be' | 'bn'; title: string }

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [selectedBook, setSelectedBook] = useState('be');
  const selectedBookTyped = (selectedBook as 'be'|'bn');
  const [showOmniboxHint, setShowOmniboxHint] = useState(false);

  // Tampilkan hint Tab-to-search sekali saja (bisa ditutup)
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('dismissOmniboxHint');
      setShowOmniboxHint(dismissed !== '1');
    } catch {}
  }, []);

  // Fetch songs on the client side
  useEffect(() => {
    setLoading(true);
    // Ambil daftar file
  fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        setSongs(data.songs);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch songs:", error);
        setLoading(false);
      });
  }, []);

  // Fetch judul bersih per buku saat buku berubah
  useEffect(() => {
    setLoading(true);
  fetch(`/api/titles?type=${selectedBook}`)
      .then(res => res.json())
      .then((data: { titles: TitleItem[] }) => {
        const map: Record<string, string> = {};
        for (const t of data.titles) {
          map[`${t.type}/${t.name}`] = t.title;
        }
        setTitles(map);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch titles:', err);
        setLoading(false);
      });
  }, [selectedBook]);

  const filteredSongs = songs
    .filter(song => song.type === selectedBook)
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));

  // 3 kolom: kolom
  const total = filteredSongs.length;
  const per12 = Math.ceil(total / 3);
  const col1Count = Math.min(per12, total);
  const col2Count = Math.min(per12, Math.max(total - col1Count, 0));
  const col3Count = Math.max(total - col1Count - col2Count, 0);

  const col1 = filteredSongs.slice(0, col1Count);
  const col2 = filteredSongs.slice(col1Count, col1Count + col2Count);
  const col3 = filteredSongs.slice(col1Count + col2Count, col1Count + col2Count + col3Count);

  return (
  <main className="bg-gray-50 dark:bg-brand-base min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Pilih Lagu</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Buku Ende dan Buku Nyanyian HKBP</p>
        </header>

        <div className="mx-auto mb-8 max-w-3xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
            <div className="flex-1">
              <label htmlFor="book-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Buku:</label>
              <select 
                id="book-select"
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="block w-full p-3 border border-gray-300 dark:border-brand-border-strong bg-white dark:bg-brand-surface text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="be">Buku Ende (BE)</option>
                <option value="bn">Buku Nyanyian (BN)</option>
              </select>
            </div>
            <div className="md:w-[320px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loncat ke nomor:</label>
              <QuickNavigator
                mode="inline"
                book={selectedBookTyped}
                onBookChange={(b: 'be'|'bn') => setSelectedBook(b)}
                showBookSelect={false}
                className="w-full"
              />
            </div>
          </div>
          {showOmniboxHint && (
            <div className="mt-4 rounded-md border border-slate-200 dark:border-brand-border bg-slate-50 dark:bg-brand-surface/60 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" className="mt-0.5 fill-slate-500 dark:fill-slate-400" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z"/></svg>
              <div className="flex-1">
                Tip: Dari bilah alamat browser, ketik alamat situs lalu tekan Tab untuk mencari cepat. Contoh: ketik &quot;3&quot; untuk melihat semua yang mengandung 3, atau ketik &quot;BN 57&quot; untuk langsung ke lagu.
              </div>
              <button
                type="button"
                className="ml-2 rounded p-1 hover:bg-slate-200 dark:hover:bg-brand-hover"
                aria-label="Tutup petunjuk"
                onClick={() => { try { localStorage.setItem('dismissOmniboxHint','1'); } catch {}; setShowOmniboxHint(false); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="fill-slate-600 dark:fill-slate-300" aria-hidden="true"><path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.9 4.89a1 1 0 101.41 1.42L12 13.41l4.89 4.9a1 1 0 001.42-1.41L13.41 12l4.9-4.89a1 1 0 000-1.4z"/></svg>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Memuat lagu...</div>
        ) : (
          <section>
            <div className="mx-auto max-w-6xl w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 justify-items-center">
                {[col1, col2, col3].map((col, idx) => (
                  <div key={idx} className="flex flex-col gap-3 w-full max-w-md items-stretch">
                    {col.map((song) => (
                      <Link
                        key={song.path}
                        href={`/songs/${song.type}/${song.name}`}
                        className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 rounded-md"
                        aria-label={`Buka lagu ${titles[`${song.type}/${song.name}`] ?? song.name}`}
                      >
                        <div className={`w-full p-3 md:p-3.5 border rounded-md text-left bg-white dark:bg-brand-surface/50 dark:border-brand-border-strong hover:shadow-md transition-all cursor-pointer ${selectedBook === 'be' ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'hover:bg-green-100 dark:hover:bg-green-900/30'}`}>
                          <span className={`font-semibold block uppercase break-words ${selectedBook === 'be' ? 'text-blue-800 dark:text-blue-400' : 'text-green-800 dark:text-green-400'} min-h-10 md:min-h-10 leading-snug`}>
                            {titles[`${song.type}/${song.name}`] ?? song.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}