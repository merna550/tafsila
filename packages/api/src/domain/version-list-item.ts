/** Maps a stored version to its light list row (no spec, no measurements); shared by both version repositories. */
import type { PatternVersion, PatternVersionListItem } from "@tafsila/schemas";

/**
 * Builds the list row of a version.
 *
 * @param version - The stored version.
 * @param isCurrent - Whether it is the design's current version.
 * @returns The list item.
 */
export function toVersionListItem(version: PatternVersion, isCurrent: boolean): PatternVersionListItem {
  return {
    id: version.id,
    versionNo: version.versionNo,
    validationStatus: version.validationStatus,
    engineVersion: version.engineVersion,
    sizeLabel: version.sizeLabel,
    easeProfile: version.easeProfile,
    measurementSetId: version.measurementSetId,
    createdBy: version.createdBy,
    createdAt: version.createdAt,
    isCurrent,
  };
}
