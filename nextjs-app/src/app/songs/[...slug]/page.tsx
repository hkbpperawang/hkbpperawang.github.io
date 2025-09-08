import Link from 'next/link';
import { LinkButton } from '@/app/components/ui/link-button';
import { InlineText } from '@/app/components/inline-text';
import { LyricsZoom } from '@/app/components/lyrics-zoom';
import { SongSidebar } from '@/app/components/song-sidebar';
import type { Metadata } from 'next';
import { fetchSongFromGithub } from '@/app/lib/song-fetch';
import { listSongsFromGithub } from '@/app/lib/songs-list';
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

async function getAllSongs(): Promise<SongInfo[]> { return listSongsFromGithub(); }

async function getSongContent(type: string, fileNameNoExt: string): Promise<SongData> {
  const name = fileNameNoExt.endsWith('.json') ? fileNameNoExt.replace(/\.json$/i, '') : fileNameNoExt;
  try {
    return await fetchSongFromGithub(type as 'be'|'bn'|'kj', name);
  } catch (err) {
    const hasStatus404 = (x: unknown): x is { status: number } =>
      typeof x === 'object' && x !== null && 'status' in (x as Record<string, unknown>) && typeof (x as { status?: unknown }).status === 'number' && (x as { status: number }).status === 404;
    if (hasStatus404(err)) {
      notFound();
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load song data for ${type}/${name}: ${message}`);
  }
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
          <LyricsZoom>
            <div className="space-y-6">
              {song.bait.map((b, index) => (
                <div key={index} className="grid grid-cols-[auto,1fr] gap-x-4 items-start">
                  <p className={`font-bold text-lg pt-1 ${b.type === 'reff' ? 'italic text-white/70' : 'text-white'}`}>
                    {b.type === 'reff' ? b.label : b.bait_no}
                  </p>
                  <div className="text-xl leading-relaxed">
                    <div className={`${b.type === 'reff' ? 'italic text-white/90 reff-content' : 'text-white bait-content'}`} data-bait={b.type !== 'reff' ? '' : undefined} data-reff={b.type === 'reff' ? '' : undefined}>
                      {b.baris.map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap">
                          <InlineText text={line} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </LyricsZoom>
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

// Metadata dinamis per lagu
export async function generateMetadata(
  { params }: { params: Promise<SongParams> }
): Promise<Metadata> {
  const { slug } = await params;
  const [typeRaw, name] = slug || [];
  const type = (typeRaw || '').toLowerCase();
  if (!type || !name) return { title: 'Nyanyian HKBP Perawang' };

  const titleText = `${type.toUpperCase()} ${name}`;

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