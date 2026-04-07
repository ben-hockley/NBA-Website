import { fetchStatLeaders } from "@/lib/api";
import StatLeadersTabs from "./StatLeadersTabs";
import ErrorMessage from "@/components/ErrorMessage";

export default async function StatsPage() {
  let categories = null;
  let error: string | null = null;

  try {
    categories = await fetchStatLeaders();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load stat leaders.";
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stat Leaders</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">2024–25 NBA Season</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {categories && categories.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No stat data available.</p>
      )}

      {categories && categories.length > 0 && (
        <StatLeadersTabs categories={categories} />
      )}
    </div>
  );
}
