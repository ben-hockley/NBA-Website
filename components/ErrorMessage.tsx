import { AlertTriangle } from "lucide-react";

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#C8102E]/25 bg-white/75 p-6 text-center backdrop-blur-xl dark:border-[#C8102E]/45 dark:bg-slate-900/75">
      <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#C8102E]/10 text-[#C8102E] dark:bg-[#C8102E]/30 dark:text-white">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 dark:text-slate-200">{message}</p>
    </div>
  );
}
