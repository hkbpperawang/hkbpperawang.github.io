import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || '').toLowerCase();
  const name = searchParams.get('name') || '';

  if (!type || !name) {
    return NextResponse.json({ message: "Query 'type' dan 'name' wajib diisi" }, { status: 400 });
  }
  if (!['be','bn','kj'].includes(type)) {
    return NextResponse.json({ message: "Param 'type' harus salah satu dari: be, bn, kj" }, { status: 400 });
  }

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    return NextResponse.json({ message: 'GITHUB_TOKEN tidak terkonfigurasi di server' }, { status: 500 });
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
    // Cache respons di edge selama 15 menit
    next: { revalidate: 900, tags: ['song', `song:${type}:${name}`] },
  });

  if (res.status === 404) {
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  }
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ message: `GitHub error: ${res.status} ${res.statusText}`, details: text }, { status: res.status });
  }

  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  const json = JSON.parse(content);

  const out = NextResponse.json({ data: json });
  out.headers.set('Cache-Control', 'public, s-maxage=900, max-age=300, stale-while-revalidate=900');
  return out;
}
