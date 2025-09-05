'use client'; // This marks the component as interactive

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Interface for song data
interface Song { name: string; path: string; type: string }
interface TitleItem { name: string; type: 'be' | 'bn'; title: string }

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<Record<string, string>>({}); // key: `${type}/${name}` -> title
  const [selectedBook, setSelectedBook] = useState('be'); // 'be' or 'bn'

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

  // Bagi menjadi 3 kolom: kolom 1 dan 2 sama jumlah baris, kolom 3 sisanya (lebih sedikit)
  const total = filteredSongs.length;
  const per12 = Math.ceil(total / 3);
  const col1Count = Math.min(per12, total);
  const col2Count = Math.min(per12, Math.max(total - col1Count, 0));
  const col3Count = Math.max(total - col1Count - col2Count, 0);

  const col1 = filteredSongs.slice(0, col1Count);
  const col2 = filteredSongs.slice(col1Count, col1Count + col2Count);
  const col3 = filteredSongs.slice(col1Count + col2Count, col1Count + col2Count + col3Count);

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Daftar Nyanyian</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">HKBP Perawang</p>
        </header>

        <div className="max-w-md mx-auto mb-8">
          <label htmlFor="book-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Buku:</label>
          <select 
            id="book-select"
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="block w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="be">Buku Ende (BE)</option>
            <option value="bn">Buku Nyanyian (BN)</option>
          </select>
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
                        <div className={`w-full p-3 md:p-3.5 border rounded-md text-left bg-white dark:bg-gray-800/50 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer ${selectedBook === 'be' ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'hover:bg-green-100 dark:hover:bg-green-900/30'}`}>
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