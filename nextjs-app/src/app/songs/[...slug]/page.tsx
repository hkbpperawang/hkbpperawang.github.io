import Link from 'next/link';
import { notFound } from 'next/navigation';

// == DATA FETCHING FUNCTIONS ==

interface SongInfo {
  name: string;
  path: string;
  type: string;
}

interface Bait {
  type: 'bait' | 'reff';
  label: string | null;
  bait_no: string | null;
  baris: string[];
}

interface SongData {
  judul: string;
  bait: Bait[];
}

async function getAllSongs(): Promise<SongInfo[]> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/songs`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.songs;
}

async function getSongContent(type: string, fileNameNoExt: string): Promise<SongData> {
  const token = process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  // Tambahkan .json hanya untuk akses GitHub Source, bukan untuk URL publik
  const fileName = fileNameNoExt.endsWith('.json') ? fileNameNoExt : `${fileNameNoExt}.json`;
  const path = `${type}/${fileName}`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' },
    next: { revalidate: 3600 },
  });

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch song data for ${path}`);

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
  const [type, fileName] = slug;
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
    <main className="bg-white dark:bg-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <nav className="flex justify-between items-center mb-6 text-sm">
          <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            &larr; Daftar Lagu
          </Link>
          <div className="flex items-center space-x-2">
            {prevSong ? (
              <Link href={`/songs/${prevSong.type}/${prevSong.name}`} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors">
                &larr; {prevSong.name}
              </Link>
            ) : <div className="px-4 py-2 invisible"></div>}
            {nextSong ? (
              <Link href={`/songs/${nextSong.type}/${nextSong.name}`} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors">
                {nextSong.name} &rarr;
              </Link>
            ) : <div className="px-4 py-2 invisible"></div>}
          </div>
        </nav>

        <header className="text-center border-b dark:border-gray-700 pb-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mt-1">{song.judul}</h1>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            {song.bait.map((b, index) => (
              <div key={index} className="grid grid-cols-[auto,1fr] gap-x-4 items-start">
                <p className={`font-bold text-lg pt-1 ${b.type === 'reff' ? 'italic text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {b.type === 'reff' ? b.label : b.bait_no}
                </p>
                <p className={`text-xl whitespace-pre-line leading-relaxed ${b.type === 'reff' ? 'italic text-gray-700 dark:text-gray-300' : 'text-gray-800 dark:text-gray-200'}`}>
                  {b.baris.join('\n')}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}