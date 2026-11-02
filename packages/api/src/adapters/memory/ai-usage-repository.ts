/** In-memory AI usage repository for tests; counts by UTC day exactly like the database function. */
import { utcDayStart } from "../../domain/utc-day";
import type { AiUsageEntry, AiUsageRepository } from "../../ports/ai-usage-repository";

/** The repository plus the rows it holds, so tests can read what was recorded. */
export interface MemoryAiUsage extends AiUsageRepository {
  /** Recorded rows, oldest first, with their time. */
  readonly rows: (AiUsageEntry & { readonly createdAt: Date })[];
}

/**
 * Creates the in-memory AI usage repository.
 *
 * @param now - Time source for new rows (defaults to the real clock).
 * @returns The repository.
 */
export function createMemoryAiUsageRepository(now: () => Date = () => new Date()): MemoryAiUsage {
  const rows: MemoryAiUsage["rows"] = [];
  return {
    rows,
    record(entry) {
      rows.push({ ...entry, createdAt: now() });
      return Promise.resolve();
    },
    countToday(userId, kind, at) {
      const since = utcDayStart(at).getTime();
      return Promise.resolve(
        rows.filter((r) => r.userId === userId && r.kind === kind && r.createdAt.getTime() >= since).length,
      );
    },
  };
}
