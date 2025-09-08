import { NextResponse } from 'next/server';
import { searchInRepo, type SearchHit } from '@/app/lib/search-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const scope = (searchParams.get('type') || 'all').toLowerCase(); // 'be' | 'bn' | 'all'
    if (!q) return NextResponse.json({ results: [] });

  const isScopeValid = (s: string): s is 'be' | 'bn' | 'all' => s === 'be' || s === 'bn' || s === 'all';
  const normalizedScope: 'be' | 'bn' | 'all' = isScopeValid(scope) ? scope : 'all';
  const hits: SearchHit[] = await searchInRepo(q, normalizedScope);

  // Batasi hasil agar respons cepat
  const res = NextResponse.json({ results: hits.slice(0, 50) });
  // Turunkan cache agar update cepat terpantau
  res.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=300, stale-while-revalidate=900');
  return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.warn('[api/search] fallback kosong:', message);
    const res = NextResponse.json({ results: [] }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
