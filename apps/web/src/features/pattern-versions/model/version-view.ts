/** Pure view-model of one version row: labels and flags derived from the API item, no React. */
import type { EaseProfile, PatternVersionListItem } from "@tafsila/schemas";
import { formatRelativeTime, type DateLocale } from "@/shared/format";

/** One version in the history list. */
export interface VersionRowView {
  /** Version id (used to open and restore). */
  readonly id: string;
  /** The number the user sees. */
  readonly versionNo: number;
  /** True for the design's current (newest) version. */
  readonly isCurrent: boolean;
  /** Validation state: `pass` shows "Sound", `warn` shows "Warning". */
  readonly status: "pass" | "warn";
  /** When it was saved, as a phrase such as "yesterday". */
  readonly saved: string;
  /** Who saved it. */
  readonly by: "user" | "chat";
  /** Size label of the measurement set, or null. */
  readonly sizeLabel: string | null;
  /** The ease preference. */
  readonly ease: EaseProfile;
  /** True when the version was saved by another engine version than the running one. */
  readonly engineChanged: boolean;
}

/**
 * Builds the row of a version.
 *
 * @param item - The API item.
 * @param engineVersion - The running engine version (same deploy as the server).
 * @param now - The current time (passed in so tests are stable).
 * @param locale - App language.
 * @returns The row.
 */
export function toVersionRow(
  item: PatternVersionListItem,
  engineVersion: string,
  now: Date,
  locale: DateLocale,
): VersionRowView {
  return {
    id: item.id,
    versionNo: item.versionNo,
    isCurrent: item.isCurrent,
    status: item.validationStatus,
    saved: formatRelativeTime(new Date(item.createdAt), now, locale),
    by: item.createdBy,
    sizeLabel: item.sizeLabel,
    ease: item.easeProfile,
    engineChanged: item.engineVersion !== engineVersion,
  };
}
