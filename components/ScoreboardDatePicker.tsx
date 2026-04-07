"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-[#17408B] dark:hover:border-blue-400 transition-colors"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">📅</span>
        <span>{selectedDateDisplay}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose scoreboard date"
          className="absolute right-0 mt-2 w-[280px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-4 z-20"
        >
          <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-3">
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
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
          />

          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                navigateToDate(shiftCompactDate(selectedDateCompact, -1));
                setOpen(false);
              }}
              className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-[#17408B] dark:hover:border-blue-400 transition-colors"
            >
              Prev Day
            </button>
            <button
              type="button"
              onClick={() => {
                navigateToDate(today);
                setOpen(false);
              }}
              className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-[#17408B] dark:hover:border-blue-400 transition-colors"
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
              className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-[#17408B] dark:hover:border-blue-400 transition-colors"
            >
              Next Day
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
