import { NextResponse } from 'next/server';
import { fetchJson } from '@/app/lib/fetch-json';
import { searchInRepo } from '@/app/lib/search-utils';

export const runtime = 'edge';

// Format OpenSearch Suggestions: [query, suggestions[], descriptions[], urls[]]
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = (url.searchParams.get('q') || '').trim();
    if (!qRaw) return NextResponse.json(["", [], [], []]);
    const base = `${url.protocol}//${url.host}`;

    const q = qRaw;
    const beBnMatch = q.match(/^\s*(be|bn|kj)\s*(\d+)\s*$/i);
    const numericOnly = /^\d+$/.test(q);

    // Helper to push result arrays
    const outQ = q;
    const suggestions: string[] = [];
    const descriptions: string[] = [];
    const urls: string[] = [];

    // Ambil daftar nomor jika perlu (1x panggil untuk performa)
    let songMap: Record<'be'|'bn'|'kj', string[]> | null = null;
    async function ensureSongs() {
      if (songMap) return;
      try {
        const data = await fetchJson<{ songs: { type: 'be'|'bn'; name: string }[] }>(`${base}/api/songs`, { timeoutMs: 6000, retries: 1 });
        const grouped: Record<'be'|'bn'|'kj', string[]> = { be: [], bn: [], kj: [] };
        for (const s of data.songs) grouped[s.type].push(s.name);
        grouped.be.sort((a,b)=>parseInt(a)-parseInt(b));
        grouped.bn.sort((a,b)=>parseInt(a)-parseInt(b));
        songMap = grouped;
      } catch {
        songMap = { be: [], bn: [], kj: [] };
      }
    }

    // 1) Pola spesifik: "BE 57" atau "BN 57" → tampilkan nomor langsung
    if (beBnMatch) {
      const type = beBnMatch[1].toLowerCase() as 'be'|'bn'|'kj';
      const num = beBnMatch[2];
      await ensureSongs();
      const exists = songMap![type].includes(num);
      suggestions.push(exists ? `Buka ${type.toUpperCase()} ${num}` : `Cari ${type.toUpperCase()} ${num}`);
      descriptions.push(exists ? `${type.toUpperCase()} ${num}` : `Hasil pencarian untuk ${type.toUpperCase()} ${num}`);
      urls.push(exists ? `/songs/${type}/${num}` : `/search?q=${encodeURIComponent(`${type.toUpperCase()} ${num}`)}`);

      // Tambahkan opsi pencarian umum juga
      suggestions.push(`Cari "${q}" di konten`);
      descriptions.push('Pencarian judul & lirik');
      urls.push(`/search?q=${encodeURIComponent(q)}`);

      return NextResponse.json([outQ, suggestions, descriptions, urls]);
    }

    // 2) Angka saja → tampilkan nomor yang diawali q dari BE, BN, KJ
    if (numericOnly) {
      await ensureSongs();
      const take = 5;
      const beNums = songMap!.be.filter(n => n.startsWith(q)).slice(0, take);
      const bnNums = songMap!.bn.filter(n => n.startsWith(q)).slice(0, take);
      for (const n of beNums) { suggestions.push(`BE ${n}`); descriptions.push(`Buku Ende ${n}`); urls.push(`/songs/be/${n}`); }
      for (const n of bnNums) { suggestions.push(`BN ${n}`); descriptions.push(`Buku Nyanyian ${n}`); urls.push(`/songs/bn/${n}`); }
      for (const n of bnNums) { suggestions.push(`KJ ${n}`); descriptions.push(`Kidung Jemaat ${n}`); urls.push(`/songs/kj/${n}`); }

      // Opsi pencarian umum di akhir
      suggestions.push(`Cari "${q}" di konten`);
      descriptions.push('Pencarian judul & lirik');
      urls.push(`/search?q=${encodeURIComponent(q)}`);

      return NextResponse.json([outQ, suggestions.slice(0, 10), descriptions.slice(0, 10), urls.slice(0, 10)]);
    }

  // 3) Teks umum → cari langsung di repo (hindari hop ke /api/search)
  const results = await searchInRepo(q, 'all');
  for (const r of results.slice(0, 10)) {
      suggestions.push(r.title);
      descriptions.push(`${r.type.toUpperCase()} ${r.name}`);
      urls.push(`/songs/${r.type}/${r.name}`);
    }
    return NextResponse.json([q, suggestions, descriptions, urls]);
  } catch {
    return NextResponse.json(["", [], [], []]);
  }
}
