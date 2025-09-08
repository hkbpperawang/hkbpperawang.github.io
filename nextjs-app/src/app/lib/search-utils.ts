export type Book = 'be'|'bn';

interface GitHubFile { type: 'file'|'dir'; name: string; path: string }

function cleanJudul(type: Book, judul: string): string {
  const prefix = type.toUpperCase() + ' ';
  return judul.startsWith(prefix) ? judul.slice(prefix.length).trimStart() : judul;
}

async function listFiles(type: Book): Promise<GitHubFile[]> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${type}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'HKBP-Perawang-App' },
    next: { revalidate: 900, tags: ['content', `content:${type}`] },
  });
  if (!res.ok) throw new Error(`List ${type} failed: ${res.status}`);
  const items = (await res.json()) as GitHubFile[];
  return items.filter(i => i.type === 'file' && i.name.endsWith('.json'));
}

async function fetchJson(path: string): Promise<{ judul?: string; judul_asli?: string; bait?: { baris?: string[] }[] }>{
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'HKBP-Perawang-App' },
    next: { revalidate: 900, tags: ['content'] },
  });
  if (!res.ok) throw new Error(`Fetch ${path} failed: ${res.status}`);
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(content) as { judul?: string; judul_asli?: string; bait?: { baris?: string[] }[] };
}

export interface SearchHit {
  type: Book;
  name: string;
  title: string;
  snippet: string;
}

export async function searchInRepo(q: string, scope: Book | 'all'): Promise<SearchHit[]> {
  const types: Book[] = scope === 'all' ? ['be','bn'] : [scope];
  const allFiles = (await Promise.all(types.map(t => listFiles(t)))).flat();
  const CONCURRENCY = 8;
  const hits: SearchHit[] = [];

  for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
    const chunk = allFiles.slice(i, i + CONCURRENCY);
    const found = await Promise.all(chunk.map(async (f) => {
      const book: Book = f.path.startsWith('be/') ? 'be' : 'bn';
      const json = await fetchJson(f.path);
      const name = f.name.replace(/\.json$/i, '');
      const title = json.judul ? cleanJudul(book, json.judul) : (json.judul_asli || name);
      const haystack = [json.judul, json.judul_asli, ...(json.bait?.flatMap(b => b.baris || []) || [])]
        .filter(Boolean)
        .join('\n');
      const idx = haystack.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return null;
      const start = Math.max(0, idx - 30);
      const end = Math.min(haystack.length, idx + q.length + 30);
      const snippet = haystack.slice(start, end).replace(/\n/g, ' ');
      return { type: book, name, title, snippet } as SearchHit;
    }));
    hits.push(...(found.filter(Boolean) as SearchHit[]));
  }
  return hits;
}
