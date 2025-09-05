import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import crypto from 'node:crypto';

type Commit = { added?: string[]; removed?: string[]; modified?: string[] };
type PushPayload = {
  ref?: string;
  repository?: { full_name?: string };
  commits?: Commit[];
};

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret || secret === 'CHANGE_ME') {
      return NextResponse.json({ message: 'Server missing GITHUB_WEBHOOK_SECRET' }, { status: 500 });
    }

    const sigHeader = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event');
    // GitHub ping event healthcheck
    if (event === 'ping') return NextResponse.json({ pong: true });
    if (!sigHeader || !event) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
    if (event !== 'push') return NextResponse.json({ ignored: true, event });

    const rawBody = await req.text();
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!safeEqual(expected, sigHeader)) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PushPayload;
    const commits = payload.commits ?? [];
    const paths = new Set<string>();
    for (const c of commits) {
      (c.added ?? []).forEach((p) => paths.add(p));
      (c.modified ?? []).forEach((p) => paths.add(p));
      (c.removed ?? []).forEach((p) => paths.add(p));
    }

    const touched = { be: false, bn: false };
    for (const p of paths) {
      if (p.startsWith('be/')) touched.be = true;
      if (p.startsWith('bn/')) touched.bn = true;
    }

    const tags: string[] = [];
    function addTags(scope: 'be' | 'bn') {
      tags.push('songs', `songs:${scope}`, 'titles', `titles:${scope}`, 'content', `content:${scope}`);
    }
    if (touched.be) addTags('be');
    if (touched.bn) addTags('bn');
    // Jika tidak terdeteksi, lakukan revalidate umum (mis. perubahan meta)
    if (!touched.be && !touched.bn) tags.push('songs', 'titles', 'content');

    const unique = Array.from(new Set(tags));
    unique.forEach((t) => revalidateTag(t));

    return NextResponse.json({ ok: true, tags: unique, repository: payload.repository?.full_name, ref: payload.ref });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
