import { NextResponse } from 'next/server';
export const runtime = 'edge';

// Define a specific type for the GitHub API response items
interface GitHubFile {
  type: 'file' | 'dir';
  name: string;
  path: string;
}

// Function to fetch contents from a specific directory in the GitHub repo
async function fetchRepoContents(directory: string) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${directory}`;

  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    console.error('GITHUB_TOKEN is not set or is a placeholder in environment variables.');
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'HKBP-Perawang-App',
    },
    next: { revalidate: 900, tags: ['songs', `songs:${directory}`] } // Tag cache untuk revalidate instan
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to fetch from GitHub API for directory '${directory}': ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to fetch data for ${directory}.`);
  }

  // Cast the JSON response to our specific type
  const contents = await response.json() as GitHubFile[];
  
  // No more 'any': item is now of type GitHubFile
  return contents
    .filter((item) => item.type === 'file' && item.name.endsWith('.json'))
    .map((item) => ({
      name: item.name.replace('.json', ''),
      path: item.path,
      type: directory,
    }));
}

export async function GET() {
  try {
    const [beFiles, bnFiles, kjFiles] = await Promise.all([
      fetchRepoContents('be'),
      fetchRepoContents('bn'),
      fetchRepoContents('kj'),
    ]);

    const allSongs = [...beFiles, ...bnFiles, ...kjFiles];

  const res = NextResponse.json({ songs: allSongs });
  // Turunkan cache agar update muncul lebih cepat di edge/CDN
  res.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=300, stale-while-revalidate=900');
  return res;
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    console.warn('[api/songs] fallback kosong:', errorMessage);
    const res = NextResponse.json({ songs: [] }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}