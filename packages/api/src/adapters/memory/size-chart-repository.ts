/** In-memory size chart repository for tests and `pnpm api:test`; serves the charts put in the store. */
import type { SizeChartRepository } from "../../ports/size-chart-repository";
import type { MemoryStore } from "./memory-store";

/**
 * Creates the in-memory size chart repository.
 *
 * @param store - Shared fake database (its `sizeCharts` list holds the system charts).
 * @returns A SizeChartRepository that serves the first chart in the store.
 */
export function createMemorySizeChartRepository(store: MemoryStore): SizeChartRepository {
  return { getDefault: () => Promise.resolve(store.sizeCharts[0]) };
}
