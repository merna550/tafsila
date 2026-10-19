/** Maps a `pattern_versions` row to the API shape; shared by the design and pattern version repositories. */
import type { PatternVersion } from "@tafsila/schemas";
import type { patternVersions } from "./schema";

/** A stored version row. */
export type PatternVersionRow = typeof patternVersions.$inferSelect;

/**
 * Maps a row to the API shape (stored inputs only, no owner).
 *
 * @param row - Database row.
 * @returns The version with an ISO date.
 */
export function toPatternVersion(row: PatternVersionRow): PatternVersion {
  return {
    id: row.id,
    designId: row.designId,
    versionNo: row.versionNo,
    spec: row.spec,
    measurementSetId: row.measurementSetId,
    measurements: row.measurements,
    sizeLabel: row.sizeLabel,
    easeProfile: row.easeProfile,
    options: row.options as Record<string, unknown>,
    engineVersion: row.engineVersion,
    validationStatus: row.validationStatus,
    inputHash: row.inputHash,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}
