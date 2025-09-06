import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // Guard awal: lewati jalur internal/aset agar tidak terintersep
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 1) Normalisasi case untuk /songs/<book> dan /songs/<book>/<num>
  const mSongs = pathname.match(/^\/songs\/(BE|BN|be|bn)(?:\/(\d+))?\/?$/);
  if (mSongs) {
    const book = mSongs[1].toLowerCase();
    const num = mSongs[2];
    const canonical = num ? `/songs/${book}/${num}` : `/songs/${book}`;
    if (pathname !== canonical) {
      url.pathname = canonical;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  // 2) Short alias: /<book> dan /<book>/<num> -> redirect ke /songs/<book>[>/<num>]
  const mShort = pathname.match(/^\/(BE|BN|be|bn)(?:\/(\d+))?\/?$/);
  if (mShort) {
    const book = mShort[1].toLowerCase();
    const num = mShort[2];
    url.pathname = num ? `/songs/${book}/${num}` : `/songs/${book}`;
    return NextResponse.redirect(url, 308);
  }

  // 3) Compact alias: /be57 atau /BN288 -> redirect ke /songs/<book>/<num>
  const mCompact = pathname.match(/^\/(BE|BN|be|bn)(\d+)\/?$/);
  if (mCompact) {
    const book = mCompact[1].toLowerCase();
    const num = mCompact[2];
    url.pathname = `/songs/${book}/${num}`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Batasi matcher hanya ke pola yang relevan agar efisien dan aman.
  matcher: [
    // Halaman kanonis songs
    '/songs/:path*',
    // Alias ringkas dengan slash
    '/(be|BE)', '/(bn|BN)',
    '/(be|BE)/:path*', '/(bn|BN)/:path*',
    // Alias compact tanpa slash: /be57, /BN288
    '/((?:be|BE|bn|BN)\\d+)',
  ],
};
