import { NextResponse } from 'next/server';

interface GitHubFile { type: 'file' | 'dir'; name: string; path: string }
interface SearchHit {
  type: 'be' | 'bn';
  name: string; // nomor lagu
  title: string; // judul (dibersihkan)
  snippet: string; // potongan baris yang cocok
}

const repo = 'hkbpperawang/nyanyian-source';

function cleanJudul(type: 'be' | 'bn', judul: string): string {
  const prefix = type.toUpperCase() + ' ';
  return judul.startsWith(prefix) ? judul.slice(prefix.length).trimStart() : judul;
}

async function listFiles(type: 'be' | 'bn') {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }
  const url = `https://api.github.com/repos/${repo}/contents/${type}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`List ${type} failed: ${res.status}`);
  const items = (await res.json()) as GitHubFile[];
  return items.filter(i => i.type === 'file' && i.name.endsWith('.json'));
}

async function fetchJson(path: string) {
  const token = process.env.GITHUB_TOKEN;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Fetch ${path} failed: ${res.status}`);
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(content) as { judul?: string; judul_asli?: string; bait?: { baris?: string[] }[] };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const scope = (searchParams.get('type') || 'all').toLowerCase(); // 'be' | 'bn' | 'all'
    if (!q) return NextResponse.json({ results: [] });

  const isScopeValid = (s: string): s is 'be' | 'bn' | 'all' => s === 'be' || s === 'bn' || s === 'all';
  const normalizedScope: 'be' | 'bn' | 'all' = isScopeValid(scope) ? scope : 'all';
  const types: ('be' | 'bn')[] = normalizedScope === 'all' ? ['be', 'bn'] : [normalizedScope as 'be' | 'bn'];

    // Kumpulkan semua file untuk tipe yang diminta
    const allFiles = (await Promise.all(types.map(t => listFiles(t)))).flat();

    const CONCURRENCY = 8;
    const hits: SearchHit[] = [];

    for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
      const chunk = allFiles.slice(i, i + CONCURRENCY);
      const res = await Promise.all(chunk.map(async (f) => {
        const type = f.path.startsWith('be/') ? 'be' as const : 'bn' as const;
        const json = await fetchJson(f.path);
        const name = f.name.replace(/\.json$/i, '');
        const title = json.judul ? cleanJudul(type, json.judul) : name;
        const haystack = [json.judul, json.judul_asli, ...(json.bait?.flatMap(b => b.baris || []) || [])]
          .filter(Boolean)
          .join('\n');
        const idx = haystack.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return null;
        const start = Math.max(0, idx - 30);
        const end = Math.min(haystack.length, idx + q.length + 30);
        const snippet = haystack.slice(start, end).replace(/\n/g, ' ');
        return { type, name, title, snippet } as SearchHit;
      }));
      hits.push(...res.filter(Boolean) as SearchHit[]);
    }

  // Batasi hasil agar respons cepat
  const res = NextResponse.json({ results: hits.slice(0, 50) });
  // Cache publik 1 bulan dengan revalidate di edge
  res.headers.set('Cache-Control', 'public, s-maxage=2592000, max-age=86400, stale-while-revalidate=86400');
  return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
