"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Live Scores / Results" },
  { href: "/standings", label: "Standings" },
  { href: "/stats", label: "Stats" },
  { href: "/teams", label: "Teams / Rosters" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#17408B] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-[#C9082A]">NBA</span>
            <span>Stats</span>
          </Link>

          {/* Nav links */}
          <div className="flex gap-1 sm:gap-2">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#C9082A] text-white"
                      : "hover:bg-white/10 text-white/80 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
