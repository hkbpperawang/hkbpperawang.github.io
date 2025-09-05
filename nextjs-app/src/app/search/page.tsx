import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const type = (sp.type || 'all').toLowerCase();
  if (!q) notFound();

  let errorMsg: string | null = null;
  let data: { results: { type: 'be'|'bn'; name: string; title: string; snippet: string }[] } = { results: [] };
  try {
    const h = await headers();
    const host = h.get('host');
    const proto = h.get('x-forwarded-proto') || 'http';
    const origin = host ? `${proto}://${host}` : '';
    const res = await fetch(`${origin}/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`, { cache: 'no-store' });
    if (!res.ok) {
      errorMsg = `Gagal memuat hasil (status ${res.status})`;
    } else {
      data = await res.json();
    }
  } catch {
    errorMsg = 'Gagal memuat hasil pencarian.';
  }

  return (
    <main className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Hasil Pencarian</h1>
          <Link href="/" className="text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Kembali</Link>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Kata kunci: <span className="font-semibold">{q}</span></p>
        {errorMsg ? (
          <p className="text-red-600 dark:text-red-400">{errorMsg}</p>
        ) : data.results.length === 0 ? (
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
