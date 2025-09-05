import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const type = (sp.type || 'all').toLowerCase();
  if (!q) notFound();

  const res = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json() as { results: { type: 'be'|'bn'; name: string; title: string; snippet: string }[] };

  return (
    <main className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Hasil Pencarian</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Kata kunci: <span className="font-semibold">{q}</span></p>
        {data.results.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">Tidak ada hasil ditemukan.</p>
        ) : (
          <ul className="space-y-3">
            {data.results.map((r, i) => (
              <li key={`${r.type}-${r.name}-${i}`} className="p-3 border rounded-md bg-white dark:bg-gray-800/50 dark:border-gray-700">
                <Link href={`/songs/${r.type}/${r.name}`} className="font-semibold hover:underline">
                  {r.title}
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{r.snippet}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
