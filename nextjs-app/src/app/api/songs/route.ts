import { NextResponse } from 'next/server';

// Define a specific type for the GitHub API response items
interface GitHubFile {
  type: 'file' | 'dir';
  name: string;
  path: string;
}

// Function to fetch contents from a specific directory in the GitHub repo
async function fetchRepoContents(directory: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${directory}`;

  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    console.error('GITHUB_TOKEN is not set or is a placeholder in environment variables.');
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 3600 } // Revalidate every hour
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
    const [beFiles, bnFiles] = await Promise.all([
      fetchRepoContents('be'),
      fetchRepoContents('bn'),
    ]);

    const allSongs = [...beFiles, ...bnFiles];

  const res = NextResponse.json({ songs: allSongs });
  res.headers.set('Cache-Control', 'public, s-maxage=2592000, max-age=86400, stale-while-revalidate=86400');
  return res;
  } catch (error) {
    // Handle the error type safely without using 'any'
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error(errorMessage);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to fetch song data from source.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}