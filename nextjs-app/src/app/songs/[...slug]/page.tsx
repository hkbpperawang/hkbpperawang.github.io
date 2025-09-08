import Link from 'next/link';
import { LinkButton } from '@/app/components/ui/link-button';
import { InlineText } from '@/app/components/inline-text';
import { SongSidebar } from '@/app/components/song-sidebar';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// == DATA FETCHING FUNCTIONS ==

interface SongInfo {
  name: string;
  path: string;
  type: string | 'kj';
}

interface Bait {
  type: 'bait' | 'reff';
  label: string | null;
  bait_no: string | null;
  baris: string[];
}

interface SongData {
  judul: string;
  judul_asli?: string;
  nada_dasar?: string;
  bait: Bait[];
}

async function getAllSongs(): Promise<SongInfo[]> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    // Jaga-jaga: fallback ke API lokal bila token kosong
    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      const r = await fetch(`${baseUrl}/api/songs`, { next: { revalidate: 900 } });
      if (!r.ok) return [];
      const d = await r.json();
      return d.songs as SongInfo[];
    } catch {
      return [];
    }
  }
  async function listDir(dir: 'be'|'bn'|'kj'): Promise<SongInfo[]> {
    const url = `https://api.github.com/repos/${repo}/contents/${dir}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'HKBP-Perawang-App',
      },
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const items = await res.json() as { type: 'file'|'dir'; name: string; path: string }[];
    return items.filter(i => i.type === 'file' && i.name.endsWith('.json')).map(i => ({
      name: i.name.replace(/\.json$/i, ''),
      path: i.path,
      type: dir,
    }));
  }
  const [be, bn, kj] = await Promise.all([listDir('be'), listDir('bn'), listDir('kj')]);
  return [...be, ...bn, ...kj];
}

async function getSongContent(type: string, fileNameNoExt: string): Promise<SongData> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const fileName = fileNameNoExt.endsWith('.json') ? fileNameNoExt : `${fileNameNoExt}.json`;
  const path = `${type}/${fileName}`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'HKBP-Perawang-App'
    },
  next: { revalidate: 900 },
  });

  if (res.status === 404) notFound();
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch song data for ${path}: ${res.status} ${res.statusText} — ${text}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(content);
}

// == THE PAGE COMPONENT ==

// Define a specific type for the page params for better type safety
type SongParams = {
  slug: string[];
};

// In Next.js 15, `params` is provided as a Promise in App Router page components
export default async function SongPage({ params }: { params: Promise<SongParams> }) {
  const { slug } = await params;
  const [typeRaw, fileName] = slug;
  const type = (typeRaw || '').toLowerCase();
  if (!type || !fileName) notFound();

  const [song, allSongs] = await Promise.all([
    getSongContent(type, fileName),
    getAllSongs(),
  ]);

  const bookSongs = allSongs
    .filter(s => s.type === type)
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  
  // Cari indeks berdasarkan type + name (tanpa ekstensi)
  const currentIndex = bookSongs.findIndex(s => s.type === type && s.name === fileName);
  const prevSong = currentIndex > 0 ? bookSongs[currentIndex - 1] : null;
  const nextSong = currentIndex < bookSongs.length - 1 ? bookSongs[currentIndex + 1] : null;

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Bar atas: tombol menu kanan dan nav prev/next di atas judul */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm">&larr; Daftar Lagu</Link>
          <SongSidebar type={type as 'be'|'bn'|'kj'} />
        </div>

        {/* Navigasi atas, fungsi sama dgn bawah */}
        <div className="flex items-center justify-between gap-2 mb-6 text-sm">
          {prevSong ? (
            <LinkButton href={`/songs/${prevSong.type}/${prevSong.name}`} className="bg-white/10 hover:bg-white/20 border border-white/20">&larr; {prevSong.name}</LinkButton>
          ) : <span />}
          {nextSong ? (
            <LinkButton href={`/songs/${nextSong.type}/${nextSong.name}`} className="bg-white/10 hover:bg-white/20 border border-white/20">{nextSong.name} &rarr;</LinkButton>
          ) : <span />}
        </div>

        <header className="text-center border-b border-white/10 pb-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">{song.judul || song.judul_asli || ''}</h1>
          {type === 'bn' && song.judul_asli ? (
            <p className="mt-2 text-base md:text-lg text-white/80">{song.judul_asli}</p>
          ) : null}
          {(() => { const nd = (song.nada_dasar || '').trim(); return nd ? (
            <div className="mt-2">
              <span
                className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-white/10 text-white border border-white/20"
                aria-label="Nada dasar"
              >
                {nd}
              </span>
            </div>
          ) : null; })()}
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            {song.bait.map((b, index) => (
              <div key={index} className="grid grid-cols-[auto,1fr] gap-x-4 items-start">
                <p className={`font-bold text-lg pt-1 ${b.type === 'reff' ? 'italic text-white/70' : 'text-white'}`}>
                  {b.type === 'reff' ? b.label : b.bait_no}
                </p>
                <div className={`text-xl leading-relaxed ${b.type === 'reff' ? 'italic text-white/90' : 'text-white'}`}>
                  {b.baris.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">
                      <InlineText text={line} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      {/* Navigasi bawah */}
      <div className="border-t border-white/10 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between text-sm">
          {prevSong ? (
            <LinkButton href={`/songs/${prevSong.type}/${prevSong.name}`} className="bg-white/10 hover:bg-white/20 border border-white/20">&larr; {prevSong.name}</LinkButton>
          ) : <span />}
          {nextSong ? (
            <LinkButton href={`/songs/${nextSong.type}/${nextSong.name}`} className="bg-white/10 hover:bg-white/20 border border-white/20">{nextSong.name} &rarr;</LinkButton>
          ) : <span />}
        </div>
      </div>
    </main>
  );
}

// SongSidebar dipindahkan ke komponen client terpisah

// Metadata dinamis per lagu
export async function generateMetadata(
  { params }: { params: Promise<SongParams> }
): Promise<Metadata> {
  const { slug } = await params;
  const [typeRaw, name] = slug || [];
  const type = (typeRaw || '').toLowerCase();
  if (!type || !name) return { title: 'Nyanyian HKBP Perawang' };

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  let titleText = `${type.toUpperCase()} ${name}`;
  try {
    const res = await fetch(`${baseUrl}/api/titles?type=${type}`, { next: { revalidate: 900 } });
    if (res.ok) {
      const data = await res.json() as { titles: { name: string; type: 'be'|'bn'|'kj'; title: string }[] };
      const found = data.titles.find(t => t.name === name);
      if (found?.title) titleText = `${found.title} — ${type.toUpperCase()} ${name}`;
    }
  } catch {}

  const fullTitle = `${titleText} — Nyanyian HKBP Perawang`;
  const description = `Lagu ${type.toUpperCase()} ${name} — lirik lengkap dari Nyanyian HKBP Perawang.`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: `/songs/${type}/${name}` },
    openGraph: {
      title: fullTitle,
      description,
      images: ['/HKBP_512.png'],
      type: 'article',
    },
    twitter: { card: 'summary', title: fullTitle, description, images: ['/HKBP_512.png'] },
  };
}