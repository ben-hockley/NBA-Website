"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Search,
  Shield,
  Trophy,
  UserCircle2,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Live Scores / Results", startsWith: "/games" },
  { href: "/standings", label: "Standings" },
  { href: "/draft/2026", label: "Draft", startsWith: "/draft" },
  { href: "/stats", label: "Stats" },
  { href: "/teams", label: "Teams", startsWith: "/teams" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl dark:border-[#1D428A]/40 dark:bg-slate-950/65">
      <div className="mx-auto max-w-[1700px] px-3 sm:px-4 lg:px-6">
        <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-2 py-1 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-100/80 dark:hover:bg-[#1D428A]/30">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1D428A] text-white">
              <Trophy className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">NBA Pulse</span>
          </Link>

          <div className="flex justify-center">
            <label className="group relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#1D428A]" />
              <input
                type="text"
                placeholder="Search teams, players, games"
                className="h-10 w-full rounded-full border border-slate-200/60 bg-white/85 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#1D428A] focus:ring-2 focus:ring-[#1D428A]/20 dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-200"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-600 transition-all duration-200 hover:scale-105 hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/70 dark:text-slate-200"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-600 transition-all duration-200 hover:scale-105 hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/70 dark:text-slate-200"
              aria-label="Profile"
            >
              <UserCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 lg:hidden">
          {navLinks.map(({ href, label, startsWith }) => {
            const active = pathname === href || (startsWith ? pathname.startsWith(startsWith) : false);
            const icon = href === "/"
              ? <CalendarDays className="h-3.5 w-3.5" />
              : href === "/teams"
                ? <Shield className="h-3.5 w-3.5" />
                : <Trophy className="h-3.5 w-3.5" />;

            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "border-[#1D428A] bg-[#1D428A] text-white"
                    : "border-slate-200/70 bg-white/80 text-slate-600 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/70 dark:text-slate-200"
                }`}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
