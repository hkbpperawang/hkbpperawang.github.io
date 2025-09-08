import type { MetadataRoute } from 'next';
import { listSongsFromGithub } from '@/app/lib/songs-list';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const urls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/songs/be`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/songs/bn`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/songs/kj`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  try {
    const songs = await listSongsFromGithub();
    for (const s of songs) {
      urls.push({ url: `${baseUrl}/songs/${s.type}/${s.name}`, changeFrequency: 'monthly', priority: 0.8 });
    }
  } catch {}

  return urls;
}
