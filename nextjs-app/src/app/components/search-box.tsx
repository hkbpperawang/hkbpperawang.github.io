'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBox() {
  const [q, setQ] = useState('');
  const router = useRouter();

  const go = () => {
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-md">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
        placeholder="Cari judul/lirik..."
        className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Cari judul atau lirik"
      />
      <button
        onClick={go}
        className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Mulai pencarian"
      >Cari</button>
    </div>
  );
}
