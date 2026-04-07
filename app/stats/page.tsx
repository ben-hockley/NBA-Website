import { fetchStatLeaders } from "@/lib/api";
import StatLeadersTabs from "./StatLeadersTabs";
import ErrorMessage from "@/components/ErrorMessage";
import { Trophy } from "lucide-react";

export default async function StatsPage() {
  let categories = null;
  let error: string | null = null;

  try {
    categories = await fetchStatLeaders();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load stat leaders.";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">League Metrics</p>
        <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          <Trophy className="h-6 w-6 text-[#1D428A] dark:text-white" />
          Stat Leaders
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">2025-26 NBA Season</p>
      </section>

      {error && <ErrorMessage message={error} />}

      {categories && categories.length === 0 && (
        <p className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 text-sm text-slate-500 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-300">No stat data available.</p>
      )}

      {categories && categories.length > 0 && (
        <StatLeadersTabs categories={categories} />
      )}
    </div>
  );
}
