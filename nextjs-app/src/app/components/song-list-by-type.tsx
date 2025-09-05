'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/app/components/ui/card';
import { QuickNavigator } from '@/app/components/quick-navigator';

type Book = 'be' | 'bn';

interface Song { name: string; path: string; type: string }
interface TitleItem { name: string; type: Book; title: string }

export function SongListByType({ type }: { type: Book }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<Record<string, string>>({});

  // Ambil daftar file
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/songs', { cache: 'no-cache' })
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setSongs(data.songs); })
      .catch((e) => console.error('Failed to fetch songs:', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Ambil judul untuk buku terkait
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/titles?type=${type}`, { cache: 'no-cache' })
      .then((res) => res.json())
      .then((data: { titles: TitleItem[] }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const t of data.titles) map[`${t.type}/${t.name}`] = t.title;
        setTitles(map);
      })
      .catch((e) => console.error('Failed to fetch titles:', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [type]);

  const filteredSongs = useMemo(() => songs.filter((s) => s.type === type).sort((a, b) => parseInt(a.name) - parseInt(b.name)), [songs, type]);

  const total = filteredSongs.length;
  const perCol = Math.ceil(total / 3);
  const col1 = filteredSongs.slice(0, perCol);
  const col2 = filteredSongs.slice(perCol, perCol * 2);
  const col3 = filteredSongs.slice(perCol * 2);

  return (
  <main className="bg-gray-50 dark:bg-brand-base min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">Daftar Lagu {type.toUpperCase()}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Buku {type === 'be' ? 'Ende' : 'Nyanyian'} HKBP</p>
        </header>

        <div className="mx-auto mb-8 max-w-3xl">
          <div className="flex items-end gap-3 justify-center">
            <div className="w-[320px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loncat ke nomor:</label>
              <QuickNavigator mode="inline" book={type} showBookSelect={false} className="w-full" />
            </div>
          </div>
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
                        aria-label={`Buka lagu ${titles[`${song.type}/${song.name}`] ?? `Nomor ${song.name}`}`}
                      >
                        <Card variant={type}>
                          <div className="flex flex-col">
                            <span className={`font-semibold block uppercase break-words ${type === 'be' ? 'text-blue-800 dark:text-blue-400' : 'text-green-800 dark:text-green-400'} leading-snug`}>
                              {titles[`${song.type}/${song.name}`] ?? ''}
                            </span>
                            <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {song.type.toUpperCase()} {song.name}
                            </span>
                          </div>
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
