"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  House,
  Shield,
  Trophy,
  GraduationCap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Scores", icon: House, startsWith: "/games" },
  { href: "/standings", label: "Standings", icon: BarChart3 },
  { href: "/stats", label: "Stats", icon: Trophy },
  { href: "/teams", label: "Teams", icon: Shield, startsWith: "/teams" },
  { href: "/draft/2026", label: "Draft", icon: GraduationCap, startsWith: "/draft" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-[4.75rem] rounded-3xl border border-slate-200/60 bg-white/70 p-2 backdrop-blur-xl dark:border-[#1D428A]/40 dark:bg-slate-900/70">
        <ul className="space-y-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, startsWith }) => {
            const active = pathname === href || (startsWith ? pathname.startsWith(startsWith) : false);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`group relative flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[#1D428A] text-white shadow-md"
                      : "text-slate-500 hover:scale-[1.02] hover:bg-slate-100/90 hover:text-[#1D428A] dark:text-slate-300 dark:hover:bg-[#1D428A]/25 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${
                      active ? "bg-[#C8102E]" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                      active
                        ? "border-white/35 bg-white/20"
                        : "border-slate-200/70 bg-white/80 group-hover:border-[#1D428A]/40 dark:border-[#1D428A]/40 dark:bg-slate-800/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-none">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
