export interface GitHubFile {
  type: 'file' | 'dir';
  name: string;
  path: string;
}

export interface SongInfo {
  name: string;
  path: string;
  type: 'be'|'bn'|'kj';
}

async function fetchDir(type: 'be'|'bn'|'kj'): Promise<SongInfo[]> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${type}`;
  const headers: Record<string,string> = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'HKBP-Perawang-App',
  };
  if (token && token !== 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') headers.Authorization = `token ${token}`;

  const res = await fetch(url, { headers, next: { revalidate: 900, tags: ['songs', `songs:${type}`] } });
  if (!res.ok) return [];
  const items = await res.json() as GitHubFile[];
  return items.filter(i => i.type === 'file' && i.name.endsWith('.json')).map(i => ({
    name: i.name.replace(/\.json$/i,'') ,
    path: i.path,
    type,
  }));
}

export async function listSongsFromGithub(): Promise<SongInfo[]> {
  const [be, bn, kj] = await Promise.all([fetchDir('be'), fetchDir('bn'), fetchDir('kj')]);
  return [...be, ...bn, ...kj];
}
