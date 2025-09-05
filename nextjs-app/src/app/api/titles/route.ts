import { NextResponse } from 'next/server';

interface GitHubFile {
  type: 'file' | 'dir';
  name: string;
  path: string;
}

interface SongTitleItem {
  name: string; // number as string, e.g., "57"
  path: string; // e.g., "be/57.json"
  type: 'be' | 'bn';
  title: string; // cleaned title without BE/BN prefix, includes number: "57 ..."
}

function cleanJudul(type: 'be' | 'bn', judul: string): string {
  const prefix = type.toUpperCase() + ' ';
  if (judul.startsWith(prefix)) {
    return judul.slice(prefix.length).trimStart();
  }
  // Fallback: remove any two-letter code followed by space, keep the rest
  const m = judul.match(/^[A-Z]{2}\s+(.*)$/);
  return m ? m[1] : judul;
}

async function listFiles(type: 'be' | 'bn') {
  const token = process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${type}`;

  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub list error: ${response.status} ${response.statusText} — ${text}`);
  }

  const contents = (await response.json()) as GitHubFile[];
  return contents.filter((i) => i.type === 'file' && i.name.endsWith('.json'));
}

async function fetchTitle(type: 'be' | 'bn', path: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub fetch error for ${path}: ${res.status} ${res.statusText} — ${text}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  const json = JSON.parse(content) as { judul?: string };
  if (!json.judul) return '';
  return cleanJudul(type, json.judul);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = (searchParams.get('type') || '').toLowerCase();
    if (typeParam !== 'be' && typeParam !== 'bn') {
      return NextResponse.json(
        { message: "Query param 'type' harus 'be' atau 'bn'" },
        { status: 400 }
      );
    }

    const type = typeParam as 'be' | 'bn';
    const files = await listFiles(type);

    // Batasi concurrency agar efisien dan aman dari rate-limit
    const CONCURRENCY = 8;
    const items: SongTitleItem[] = [];

    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const chunk = files.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (f) => {
          const name = f.name.replace(/\.json$/i, '');
          const title = await fetchTitle(type, f.path);
          return {
            name,
            path: f.path,
            type,
            title: title || name,
          } satisfies SongTitleItem;
        })
      );
      items.push(...results);
    }

    // Urutkan berdasarkan nomor
    items.sort((a, b) => parseInt(a.name) - parseInt(b.name));

    return NextResponse.json({ titles: items }, { status: 200 });
  } catch (err) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}
