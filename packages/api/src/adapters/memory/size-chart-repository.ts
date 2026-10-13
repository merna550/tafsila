/** In-memory size chart repository for tests and `pnpm api:test`; serves the charts put in the store and lets an admin replace the first. */
import { AppError } from "../../domain/errors";
import type { SizeChartRecord, SizeChartRepository } from "../../ports/size-chart-repository";
import { type ChartRow, type MemoryOptions, type MemoryStore } from "./memory-store";

/** Edit time used for a chart nobody has saved yet (the migration's insert time in the database). */
const NEVER_EDITED = "1970-01-01T00:00:00.000Z";

/**
 * Adds the edit trail defaults to a stored chart.
 *
 * @param row - Stored chart.
 * @returns The record the port returns.
 */
function toRecord(row: ChartRow): SizeChartRecord {
  return {
    id: row.id,
    name: row.name,
    sizes: row.sizes,
    updatedAt: row.updatedAt ?? NEVER_EDITED,
    updatedBy: row.updatedBy ?? null,
  };
}

/**
 * Creates the in-memory size chart repository.
 *
 * @param store - Shared fake database (its `sizeCharts` list holds the system charts, `users` decides who is an admin).
 * @param options - Time source for the edit trail.
 * @returns A SizeChartRepository that serves the first chart in the store.
 */
export function createMemorySizeChartRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): SizeChartRepository {
  const now = options.now ?? (() => new Date());
  return {
    getDefault: () => Promise.resolve(store.sizeCharts[0]),
    getDefaultRecord: () => Promise.resolve(store.sizeCharts[0] ? toRecord(store.sizeCharts[0]) : undefined),
    replaceDefault: (admin, input) => {
      const before = store.sizeCharts[0];
      if (!before) return Promise.resolve(undefined);
      // Like the database, only an admin in the users table may write; the token alone is not enough.
      if (store.users.find((user) => user.id === admin.userId)?.role !== "admin") {
        return Promise.reject(new AppError("FORBIDDEN"));
      }
      const at = now().toISOString();
      const after: ChartRow = {
        id: before.id,
        name: input.name ?? before.name,
        sizes: input.sizes,
        updatedAt: at,
        updatedBy: admin.userId,
      };
      store.sizeCharts[0] = after;
      store.audit.push({
        who: admin.userId,
        action: "size_chart.updated",
        target: after.id,
        before: { name: before.name, sizes: before.sizes },
        after: { name: after.name, sizes: after.sizes },
        at,
      });
      return Promise.resolve(toRecord(after));
    },
  };
}
