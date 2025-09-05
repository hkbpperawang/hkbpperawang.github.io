import Link from 'next/link';
import { notFound } from 'next/navigation';

// == DATA FETCHING FUNCTIONS ==
// Note: In a larger app, these would be in a separate lib/data.ts file.

interface SongInfo {
  name: string;
  path: string;
  type: string;
}

interface SongData {
  title: string;
  lyrics: Array<{ verse: number | string; text: string; }>;
}

async function getAllSongs(): Promise<SongInfo[]> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/songs`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.songs;
}

async function getSongContent(type: string, fileName: string): Promise<SongData> {
  const token = process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
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

export default async function SongPage({ params }: { params: { slug: string[] } }) {
  const [type, fileName] = params.slug;
  if (!type || !fileName) notFound();

  // Fetch current song and all songs in parallel
  const [song, allSongs] = await Promise.all([
    getSongContent(type, fileName),
    getAllSongs(),
  ]);

  // Determine previous and next songs
  const bookSongs = allSongs
    .filter(s => s.type === type)
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  
  const currentIndex = bookSongs.findIndex(s => s.path === `${type}/${fileName}`);
  const prevSong = currentIndex > 0 ? bookSongs[currentIndex - 1] : null;
  const nextSong = currentIndex < bookSongs.length - 1 ? bookSongs[currentIndex + 1] : null;

  const songNumber = fileName.replace('.json', '');

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header and Navigation */}
        <nav className="flex justify-between items-center mb-6 text-sm">
          <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            &larr; Daftar Lagu
          </Link>
          <div className="flex items-center space-x-2">
            {prevSong ? (
              <Link href={`/songs/${prevSong.path}`} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                &larr; {prevSong.name}
              </Link>
            ) : <div className="px-4 py-2 invisible"></div>}
            {nextSong ? (
              <Link href={`/songs/${nextSong.path}`} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                {nextSong.name} &rarr;
              </Link>
            ) : <div className="px-4 py-2 invisible"></div>}
          </div>
        </nav>

        {/* Song Title */}
        <header className="text-center border-b pb-6 mb-8">
          <p className="text-lg font-semibold text-gray-500">{type.toUpperCase()} {songNumber}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">{song.title}</h1>
        </header>

        {/* Lyrics */}
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            {song.lyrics.map((lyric, index) => (
              <div key={index} className="grid grid-cols-[auto,1fr] gap-x-4 items-start">
                <p className="font-bold text-gray-800 text-lg pt-1">{lyric.verse}</p>
                <p className="text-xl text-gray-800 whitespace-pre-line leading-relaxed">
                  {lyric.text}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}