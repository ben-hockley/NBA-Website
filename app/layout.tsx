import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import SidebarNav from "@/components/SidebarNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "NBA Stats",
  description: "Live NBA scores, standings, and team rosters powered by ESPN API",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />

        <div className="mx-auto w-full max-w-[1700px] px-3 pb-8 pt-4 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
            <SidebarNav />

            <main className="min-w-0">{children}</main>
          </div>

          <footer className="mt-6 rounded-full border border-slate-200/60 bg-white/70 px-4 py-2 text-center text-xs text-slate-500 backdrop-blur-xl dark:border-[#1D428A]/40 dark:bg-slate-900/70 dark:text-slate-300">
            Data provided by ESPN API · NBA Stats
          </footer>
        </div>
      </body>
    </html>
  );
}
