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
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {filteredSongs.map(song => (
                <Link key={song.path} href={`/songs/${song.type}/${song.name}`}>
                  <div className={`p-2 border rounded-md text-center bg-white dark:bg-gray-800/50 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer ${selectedBook === 'be' ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'hover:bg-green-100 dark:hover:bg-green-900/30'}`}>
                    <span className={`font-semibold ${selectedBook === 'be' ? 'text-blue-800 dark:text-blue-400' : 'text-green-800 dark:text-green-400'}`}>
                      {titles[`${song.type}/${song.name}`] ?? song.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}