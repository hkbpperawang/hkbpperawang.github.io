import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const urls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/songs/be`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/songs/bn`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  try {
    const res = await fetch(`${baseUrl}/api/songs`, { next: { revalidate: 900 } });
    if (res.ok) {
      const data = await res.json();
      for (const s of data.songs as { type: string; name: string }[]) {
        urls.push({ url: `${baseUrl}/songs/${s.type}/${s.name}`, changeFrequency: 'monthly', priority: 0.8 });
      }
    }
  } catch {}

  return urls;
}
