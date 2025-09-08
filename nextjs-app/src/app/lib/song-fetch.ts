// Util server: ambil konten lagu langsung dari GitHub Contents API
export interface Bait {
  type: 'bait' | 'reff';
  label: string | null;
  bait_no: string | null;
  baris: string[];
}

export interface SongData {
  judul: string;
  judul_asli?: string;
  nada_dasar?: string;
  bait: Bait[];
}

export async function fetchSongFromGithub(type: 'be'|'bn'|'kj', name: string): Promise<SongData> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('GITHUB_TOKEN tidak terkonfigurasi di server');
  }
  const repo = 'hkbpperawang/nyanyian-source';
  const file = name.endsWith('.json') ? name : `${name}.json`;
  const path = `${type}/${file}`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'HKBP-Perawang-App',
    },
    next: { revalidate: 900, tags: ['song', `song:${type}:${name}`] },
  });

  if (res.status === 404) {
    throw Object.assign(new Error('Not Found'), { status: 404 });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub error: ${res.status} ${res.statusText} — ${text}`);
  }

  const data = await res.json() as { content: string };
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  const json = JSON.parse(content) as SongData;
  return json;
}
