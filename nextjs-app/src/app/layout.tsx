import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import Image from "next/image";
import Link from "next/link";
import { SearchBox } from "@/app/components/search-box";
import { BackToTop } from "@/app/components/back-to-top";
import { CopyPlainText } from "@/app/components/copy-plain-text";

export const metadata: Metadata = {
  title: "Kidung Nyanyian",
  description: "Kidung Nyanyian oleh Tim Multimedia HKBP Perawang.",
  icons: {
    icon: [
  { url: "/HKBP_512.png", type: "image/png", sizes: "32x32" },
  { url: "/HKBP_512.png", type: "image/png", sizes: "192x192" },
  { url: "/HKBP_512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [
  "/HKBP_512.png",
    ],
    apple: [
      { url: "/HKBP_512.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Kidung Nyanyian" />
        {/* Force favicon to HKBP_512.png and bust old caches */}
        <link rel="icon" href="/HKBP_512.png?v=2" sizes="32x32" type="image/png" />
        <link rel="icon" href="/HKBP_512.png?v=2" sizes="192x192" type="image/png" />
        <link rel="icon" href="/HKBP_512.png?v=2" sizes="512x512" type="image/png" />
      </head>
  <body className="min-h-dvh bg-[#0C134F] text-white">
        <div className="site-bg" aria-hidden="true">
          <div className="blob b1" />
          <div className="blob b2" />
          <div className="blob b3" />
        </div>
        <div className="relative min-h-screen">
          <header className="sticky top-0 z-20 border-b border-white/15 shadow-sm bg-[#0C134F]/70 glass-panel">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-3 min-w-0 whitespace-nowrap overflow-hidden group">
                <Image src="/HKBP_512.png" alt="HKBP Perawang" width={32} height={32} className="rounded transition-transform group-hover:scale-105" />
                <h1 className="text-lg font-semibold truncate group-hover:underline text-white">Kidung Nyanyian</h1>
              </Link>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <SearchBox />
              </div>
            </div>
          </header>
          <main>{children}</main>
          {/* Listener global: paksa hasil salin menjadi teks polos */}
          <CopyPlainText />
          <BackToTop />
          <footer className="mt-8 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-white/70 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2024–{new Date().getFullYear()} <a className="underline hover:text-white" href="https://wwwhkbpperawang.org" target="_blank" rel="noopener noreferrer">HKBP Perawang</a>.</p>
              <p>Dibuat oleh Tim Multimedia HKBP Perawang.</p>
            </div>
          </footer>
        </div>
  {/* Vercel Speed Insights */}
  <SpeedInsights />
  {/* Vercel Analytics */}
  <Analytics />
      </body>
    </html>
  );
}
