import { NextResponse } from 'next/server';
export const runtime = 'edge';

interface GitHubFile {
  type: 'file' | 'dir';
  name: string;
  path: string;
  download_url?: string | null;
}

interface SongTitleItem {
  name: string; // number as string, e.g., "57"
  path: string; // e.g., "be/57.json"
  type: 'be' | 'bn' | 'kj';
  title: string; // exact judul from source JSON
}

async function listFiles(type: 'be' | 'bn' | 'kj') {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${type}`;

  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'HKBP-Perawang-App',
    },
    next: { revalidate: 900, tags: ['titles', `titles:${type}`] },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub list error: ${response.status} ${response.statusText} — ${text}`);
  }

  const contents = (await response.json()) as GitHubFile[];
  return contents.filter((i) => i.type === 'file' && i.name.endsWith('.json'));
}

async function fetchTitle(type: 'be' | 'bn' | 'kj', file: GitHubFile): Promise<string> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const rawUrl = file.download_url;
  let text: string | null = null;
  if (rawUrl) {
    const resRaw = await fetch(rawUrl, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'HKBP-Perawang-App',
      },
      next: { revalidate: 3600 },
    });
    if (resRaw.ok) {
      text = await resRaw.text();
    }
  }
  if (text === null) {
    // Fallback to contents API (base64)
    const url = `https://api.github.com/repos/${repo}/contents/${file.path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'HKBP-Perawang-App',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`GitHub fetch error for ${file.path}: ${res.status} ${res.statusText} - ${t}`);
    }
    const data = await res.json();
    text = Buffer.from(data.content, 'base64').toString('utf-8');
  }

  const json = JSON.parse(text) as { judul?: string; judul_asli?: string };
  if (json.judul) return json.judul; // return exact value as requested
  if (json.judul_asli) return json.judul_asli;
  return '';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
  const typeParam = (searchParams.get('type') || '').toLowerCase();
  if (typeParam !== 'be' && typeParam !== 'bn' && typeParam !== 'kj') {
      return NextResponse.json(
    { message: "Query param 'type' harus 'be', 'bn', atau 'kj'" },
        { status: 400 }
      );
    }

  const type = typeParam as 'be' | 'bn' | 'kj';
    const files = await listFiles(type);

    // Batasi concurrency agar efisien namun cepat
    const CONCURRENCY = 32;
    const items: SongTitleItem[] = [];

    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const chunk = files.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (f) => {
          const name = f.name.replace(/\.json$/i, '');
          const title = await fetchTitle(type, f);
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

  const res = NextResponse.json({ titles: items }, { status: 200 });
  res.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=300, stale-while-revalidate=900');
  return res;
  } catch (err) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    console.warn('[api/titles] fallback kosong:', message);
    const res = NextResponse.json({ titles: [] }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}
