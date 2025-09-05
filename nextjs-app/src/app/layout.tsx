import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/components/theme-provider";
import { ThemeSwitcher } from "@/app/components/theme-switcher";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nyanyian HKBP Perawang",
  description: "Buku Ende dan Buku Nyanyian HKBP Perawang",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-950`}>
        <ThemeProvider>
          <div className="relative min-h-screen">
            <div className="absolute top-4 right-4 z-10">
              <ThemeSwitcher />
            </div>
            {children}
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
