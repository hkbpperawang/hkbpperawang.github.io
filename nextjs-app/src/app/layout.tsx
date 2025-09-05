import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/components/theme-provider";
import { ThemeSwitcher } from "@/app/components/theme-switcher";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import Image from "next/image";
import { SearchBox } from "@/app/components/search-box";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nyanyian HKBP Perawang",
  description: "Buku Ende dan Buku Nyanyian HKBP oleh Tim Digital HKBP Perawang",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <ThemeProvider>
          <div className="relative min-h-screen">
            <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
              <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-3">
                <div className="flex items-center gap-3">
                  <Image src="/HKBP_512.png" alt="HKBP Perawang" width={32} height={32} className="rounded" />
                  <h1 className="text-lg font-semibold">BE dan BN HKBP</h1>
                </div>
                <div className="justify-self-center w-full flex items-center justify-center">
                  <SearchBox />
                </div>
                <div className="justify-self-end">
                  <ThemeSwitcher />
                </div>
              </div>
            </header>
            <main>{children}</main>
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
