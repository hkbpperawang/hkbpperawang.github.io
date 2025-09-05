import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

type Scope = 'be' | 'bn' | 'all';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const secretFromQuery = url.searchParams.get('secret');
    const secretFromHeader = req.headers.get('x-revalidate-secret') ?? undefined;
    const secret = process.env.REVALIDATE_SECRET;

    if (!secret || secret === 'CHANGE_ME') {
      return NextResponse.json({ message: 'Server missing REVALIDATE_SECRET' }, { status: 500 });
    }
    if (secretFromQuery !== secret && secretFromHeader !== secret) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let scope: Scope = 'all';
    let tags: string[] | undefined;
    try {
      const body = await req.json().catch(() => undefined) as { scope?: Scope; tags?: string[] } | undefined;
      if (body?.scope === 'be' || body?.scope === 'bn' || body?.scope === 'all') scope = body.scope;
      if (Array.isArray(body?.tags)) tags = body!.tags;
    } catch {}

    // Default tags untuk seluruh konten
    const defaultTags = ['songs', 'titles', 'content'];
    const targetTags = tags && tags.length > 0 ? tags : defaultTags;

    const scoped = (t: string) => {
      if (scope === 'all') return [t, `${t}:be`, `${t}:bn`];
      return [t, `${t}:${scope}`];
    };

    const unique = new Set<string>();
    targetTags.forEach((t) => scoped(t).forEach((x) => unique.add(x)));

    unique.forEach((t) => revalidateTag(t));

    return NextResponse.json({ revalidated: true, tags: Array.from(unique) });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
