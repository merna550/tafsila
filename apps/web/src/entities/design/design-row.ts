/** Pure view-model of one design in a list: what a row or card shows, derived from the API item. */
import type { DesignListItem, GarmentCategory } from "@tafsila/schemas";
import { formatRelativeTime, type DateLocale } from "@/shared/format";

/** Validation state of the newest version; "none" for a design without a version. */
export type DesignRowStatus = "pass" | "warn" | "none";

/** One design in a list. */
export interface DesignRow {
  /** Design id (used for the link). */
  readonly id: string;
  /** Title. */
  readonly title: string;
  /** Garment type. */
  readonly category: GarmentCategory;
  /** Client the newest version was made for, or null. */
  readonly clientName: string | null;
  /** Last change, as a phrase such as "yesterday". */
  readonly updated: string;
  /** Number of saved versions. */
  readonly versionCount: number;
  /** Validation state of the newest version. */
  readonly status: DesignRowStatus;
}

/**
 * Builds the row of a design.
 *
 * @param item - The API item.
 * @param now - The current time (passed in so tests are stable).
 * @param locale - App language.
 * @returns The row.
 */
export function toDesignRow(item: DesignListItem, now: Date, locale: DateLocale): DesignRow {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    clientName: item.summary.clientName,
    updated: formatRelativeTime(new Date(item.updatedAt), now, locale),
    versionCount: item.summary.versionCount,
    status: item.summary.currentStatus ?? "none",
  };
}
