import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/components/theme-provider";
import { ThemeSwitcher } from "@/app/components/theme-switcher";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import Image from "next/image";
import { SearchBox } from "@/app/components/search-box";
import { QuickNavigator } from "@/app/components/quick-navigator";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const m = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = m === 'dark' || (m === 'system' && systemDark) || (!m && systemDark) ? 'dark' : 'light';
                document.documentElement.classList.remove('light','dark');
                document.documentElement.classList.add(theme);
              } catch {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <ThemeProvider>
          <div className="relative min-h-screen">
            <header className="sticky top-0 z-20 border-b shadow-sm bg-white/60 dark:bg-gray-950/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-gray-950/50 border-white/20 dark:border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 whitespace-nowrap overflow-hidden">
                  <Image src="/HKBP_512.png" alt="HKBP Perawang" width={32} height={32} className="rounded" />
                  <h1 className="text-lg font-semibold truncate">BE dan BN HKBP</h1>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <SearchBox />
                  <ThemeSwitcher />
                </div>
              </div>
            </header>
            <main>{children}</main>
            <QuickNavigator />
            <footer className="mt-8 border-t border-gray-200 dark:border-gray-800">
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
