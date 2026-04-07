import { LoaderCircle } from "lucide-react";

export default function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/75 px-6 py-10 text-center text-slate-500 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-300">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 dark:border-[#1D428A]/40 dark:bg-slate-800/80">
        <LoaderCircle className="h-6 w-6 animate-spin text-[#1D428A] dark:text-white" />
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}
