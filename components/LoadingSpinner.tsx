export default function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500 dark:text-gray-400">
      <div className="w-10 h-10 border-4 border-[#17408B] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
