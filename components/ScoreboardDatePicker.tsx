"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  selectedDateCompact: string;
  selectedDateDisplay: string;
}

function compactToIso(compact: string): string {
  if (!/^\d{8}$/.test(compact)) return "";
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

function isoToCompact(iso: string): string {
  const compact = iso.replaceAll("-", "");
  return /^\d{8}$/.test(compact) ? compact : "";
}

function shiftCompactDate(compact: string, days: number): string {
  if (!/^\d{8}$/.test(compact)) return compact;

  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function todayCompactDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export default function ScoreboardDatePicker({ selectedDateCompact, selectedDateDisplay }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [calendarValue, setCalendarValue] = useState(compactToIso(selectedDateCompact));

  const today = useMemo(() => todayCompactDate(), []);
  const isToday = selectedDateCompact === today;

  useEffect(() => {
    setCalendarValue(compactToIso(selectedDateCompact));
  }, [selectedDateCompact]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const navigateToDate = (nextCompact: string) => {
    if (!/^\d{8}$/.test(nextCompact)) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextCompact === today) {
      params.delete("date");
    } else {
      params.set("date", nextCompact);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div ref={wrapperRef} className="relative z-[90]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-100"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarDays className="h-4 w-4" />
        <span>{selectedDateDisplay}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose scoreboard date"
          className="absolute right-0 z-[100] mt-2 w-[280px] rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-lg backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/85"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
            Jump To Date
          </p>

          <input
            type="date"
            value={calendarValue}
            onChange={(event) => {
              const iso = event.target.value;
              setCalendarValue(iso);
              const compact = isoToCompact(iso);
              if (compact) {
                navigateToDate(compact);
                setOpen(false);
              }
            }}
            className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-[#1D428A] focus:ring-2 focus:ring-[#1D428A]/20 dark:border-[#1D428A]/45 dark:bg-slate-900/80 dark:text-slate-100"
          />

          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                navigateToDate(shiftCompactDate(selectedDateCompact, -1));
                setOpen(false);
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200/70 bg-white/80 px-2 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/80 dark:text-slate-100"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev Day
            </button>
            <button
              type="button"
              onClick={() => {
                navigateToDate(today);
                setOpen(false);
              }}
              className="rounded-lg border border-slate-200/70 bg-white/80 px-2 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] disabled:opacity-50 dark:border-[#1D428A]/45 dark:bg-slate-900/80 dark:text-slate-100"
              disabled={isToday}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                navigateToDate(shiftCompactDate(selectedDateCompact, 1));
                setOpen(false);
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200/70 bg-white/80 px-2 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/80 dark:text-slate-100"
            >
              Next Day
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
