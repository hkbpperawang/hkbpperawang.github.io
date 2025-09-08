
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/app/components/ui/card';
import { QuickNavigator } from '@/app/components/quick-navigator';
import { BookSelect } from '@/app/components/ui/book-select';
import { loadTitles, prefetchOtherBooks } from '@/app/lib/titles-cache';

// Interface for song data
interface Song { name: string; path: string; type: string }

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [selectedBook, setSelectedBook] = useState('be');
  const selectedBookTyped = (selectedBook as 'be'|'bn'|'kj');
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

  // Fetch judul bersih per buku saat buku berubah (pakai cache) + prefetch buku lain
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadTitles(selectedBookTyped)
      .then((map) => { if (!cancelled) setTitles(map); })
      .catch((err) => console.error('Failed to load titles:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    // prefetch dua buku lain untuk navigasi cepat
    prefetchOtherBooks(selectedBookTyped);
    return () => { cancelled = true; };
  }, [selectedBookTyped]);

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
  <main className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-extrabold text-white">Daftar Lagu</h1>
          <p className="text-lg text-white/80 mt-2">Buku Ende, Buku Nyanyian HKBP, dan Kidung Jemaat</p>
        </header>

        <div className="mx-auto mb-8 max-w-3xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
            <div className="flex-1">
              <label htmlFor="book-select" className="block text-sm font-medium text-white/80 mb-2">Pilih Buku:</label>
              <BookSelect
                id="book-select"
                value={selectedBookTyped}
                onChange={(v) => setSelectedBook(v)}
                className="w-full"
              />
            </div>
            <div className="md:w-[320px]">
              <label className="block text-sm font-medium text-white/80 mb-2">Loncat ke nomor:</label>
              <QuickNavigator
                mode="inline"
                book={selectedBookTyped}
                onBookChange={(b: 'be'|'bn'|'kj') => setSelectedBook(b)}
                showBookSelect={false}
                className="w-full"
              />
            </div>
          </div>
          {showOmniboxHint && (
            <div className="mt-4 rounded-md border border-white/15 bg-white/10 backdrop-blur px-3 py-2 text-sm text-white flex items-start gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" className="mt-0.5 fill-white/80" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z"/></svg>
              <div className="flex-1">
                Tip: Dari bilah alamat browser, ketik alamat situs lalu tekan Tab untuk mencari cepat. Contoh: ketik &quot;3&quot; untuk melihat semua yang mengandung 3, atau ketik &quot;BN 57&quot; untuk langsung ke lagu.
              </div>
              <button
                type="button"
                className="ml-2 rounded p-1 hover:bg-white/10"
                aria-label="Tutup petunjuk"
                onClick={() => { try { localStorage.setItem('dismissOmniboxHint','1'); } catch {}; setShowOmniboxHint(false); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="fill-white/80" aria-hidden="true"><path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.9 4.89a1 1 0 101.41 1.42L12 13.41l4.89 4.9a1 1 0 001.42-1.41L13.41 12l4.9-4.89a1 1 0 000-1.4z"/></svg>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-white/80">Memuat lagu...</div>
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
                        className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md"
                        aria-label={`Buka lagu ${titles[`${song.type}/${song.name}`] ?? song.name}`}
                      >
                        <Card variant={selectedBookTyped}>
                          <span className={`font-semibold block uppercase break-words min-h-10 md:min-h-10 leading-snug`}>
                            {titles[`${song.type}/${song.name}`] ?? song.name}
                          </span>
                        </Card>
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
