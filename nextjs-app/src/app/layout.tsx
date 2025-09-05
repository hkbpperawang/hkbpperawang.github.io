import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/theme-provider";
import ThemeSwitcher from "@/app/components/theme-switcher";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import Image from "next/image";
import Link from "next/link";
import { SearchBox } from "@/app/components/search-box";
import { BackToTop } from "@/app/components/back-to-top";

// font default dari Tailwind digunakan, Inter tidak dipakai

export const metadata: Metadata = {
  title: "Nyanyian HKBP Perawang",
  description: "Buku Ende dan Buku Nyanyian HKBP oleh Tim Digital HKBP Perawang",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
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
        <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Nyanyian HKBP" />
      </head>
  <body className="min-h-dvh bg-white text-slate-900 dark:bg-brand-base dark:text-slate-100">
        <ThemeProvider>
          <div className="relative min-h-screen">
            <header className="sticky top-0 z-20 border-b shadow-sm bg-white dark:bg-brand-base border-slate-200 dark:border-brand-border">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-3 min-w-0 whitespace-nowrap overflow-hidden group">
                  <Image src="/HKBP_512.png" alt="HKBP Perawang" width={32} height={32} className="rounded transition-transform group-hover:scale-105" />
                  <h1 className="text-lg font-semibold truncate group-hover:underline">BE dan BN HKBP</h1>
                </Link>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <SearchBox />
                  <ThemeSwitcher />
                </div>
              </div>
            </header>
            <main>{children}</main>
            <BackToTop />
            <footer className="mt-8 border-t border-gray-200 dark:border-brand-border">
              <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>© 2024–{new Date().getFullYear()} HKBP Perawang.</p>
                <p>
                  Dibuat oleh <a className="underline hover:text-gray-900 dark:hover:text-gray-200" href="https://wwwhkbpperawang.org" target="_blank" rel="noopener noreferrer">Tim Multimedia HKBP Perawang</a>
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
  {/* Vercel Speed Insights */}
  <SpeedInsights />
  {/* Vercel Analytics */}
  <Analytics />
      </body>
    </html>
  );
}
