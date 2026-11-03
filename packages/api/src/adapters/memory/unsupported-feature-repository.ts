/** In-memory UnsupportedFeatureRepository for tests; de-duplicates by design and text like the database function. */
import type { UnsupportedFeatureRepository } from "../../ports/unsupported-feature-repository";

/** One stored row. */
export interface UnsupportedFeatureRow {
  readonly userId: string;
  readonly designId: string;
  readonly text: string;
  /** When the row was stored (ISO). */
  readonly createdAt: string;
}

/** The repository plus the rows it holds. */
export interface MemoryUnsupportedFeatures extends UnsupportedFeatureRepository {
  /** Stored rows, oldest first. */
  readonly rows: UnsupportedFeatureRow[];
}

/** Longest stored text (the column check). */
const MAX_TEXT = 500;

/**
 * Creates the in-memory repository.
 *
 * @returns The repository.
 */
export function createMemoryUnsupportedFeatures(): MemoryUnsupportedFeatures {
  const rows: UnsupportedFeatureRow[] = [];
  return {
    rows,
    recordMany(userId, designId, texts) {
      let added = 0;
      for (const raw of texts) {
        const text = raw.trim().slice(0, MAX_TEXT);
        if (text === "" || rows.some((row) => row.designId === designId && row.text === text)) continue;
        rows.push({ userId, designId, text, createdAt: new Date().toISOString() });
        added += 1;
      }
      return Promise.resolve(added);
    },
  };
}
