import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Cocokkan /songs/<book>/<num> di mana <book> bisa huruf besar/kecil
  const m = pathname.match(/^\/songs\/(BE|BN|be|bn)\/(\d+)(?:\/?|$)/);
  if (m) {
    const book = m[1].toLowerCase();
    const num = m[2];
    const canonical = `/songs/${book}/${num}`;
    if (pathname !== canonical) {
      const url = req.nextUrl.clone();
      url.pathname = canonical;
      return NextResponse.redirect(url, 308);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/songs/:path*'],
};
