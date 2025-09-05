import { NextResponse } from 'next/server';

// Function to fetch contents from a specific directory in the GitHub repo
async function fetchRepoContents(directory: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = 'hkbpperawang/nyanyian-source';
  const url = `https://api.github.com/repos/${repo}/contents/${directory}`;

  if (!token || token === 'PASTE_YOUR_NEW_AND_SECRET_TOKEN_HERE') {
    // This error will be seen on the server, not by the client
    console.error('GITHUB_TOKEN is not set or is a placeholder in environment variables.');
    throw new Error('Server configuration error: GITHUB_TOKEN is missing.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    // Use revalidation to cache the response for a certain time
    next: { revalidate: 3600 } // Revalidate every hour
  });

  if (!response.ok) {
    // Log more details on the server for debugging
    const errorBody = await response.text();
    console.error(`Failed to fetch from GitHub API for directory '${directory}': ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to fetch data for ${directory}.`);
  }

  const contents = await response.json();
  // Filter for files only and extract relevant data
  return contents
    .filter((item: any) => item.type === 'file' && item.name.endsWith('.json'))
    .map((item: any) => ({
      name: item.name.replace('.json', ''),
      path: item.path,
      type: directory, // Add 'be' or 'bn' to distinguish the song type
    }));
}

export async function GET() {
  try {
    // Fetch both directories in parallel
    const [beFiles, bnFiles] = await Promise.all([
      fetchRepoContents('be'),
      fetchRepoContents('bn'),
    ]);

    const allSongs = [...beFiles, ...bnFiles];

    return NextResponse.json({ songs: allSongs });
  } catch (error: any) {
    // Return a generic error to the client, but log the specific one on the server
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to fetch song data from source.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
