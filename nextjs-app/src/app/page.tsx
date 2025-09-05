'use client'; // This marks the component as interactive

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Interface for song data
interface Song {
  name: string;
  path: string;
  type: string;
}

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState('be'); // 'be' or 'bn'

  // Fetch songs on the client side
  useEffect(() => {
    setLoading(true);
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

  const filteredSongs = songs
    .filter(song => song.type === selectedBook)
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Daftar Nyanyian</h1>
          <p className="text-lg text-gray-600 mt-2">HKBP Perawang</p>
        </header>

        <div className="max-w-md mx-auto mb-8">
          <label htmlFor="book-select" className="block text-sm font-medium text-gray-700 mb-2">Pilih Buku:</label>
          <select 
            id="book-select"
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="block w-full p-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="be">Buku Ende (BE)</option>
            <option value="bn">Buku Nyanyian (BN)</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Memuat lagu...</div>
        ) : (
          <section>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {filteredSongs.map(song => (
                <Link key={song.path} href={`/songs/${song.path}`}>
                  <div className={`p-2 border rounded-md text-center bg-white hover:shadow-md transition-all cursor-pointer ${selectedBook === 'be' ? 'hover:bg-blue-100' : 'hover:bg-green-100'}`}>
                    <span className={`font-semibold ${selectedBook === 'be' ? 'text-blue-800' : 'text-green-800'}`}>
                      {song.name}
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
