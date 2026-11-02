/** Pure rules for the "compare" ticks on the version history: at most two, and the link that opens the compare view (issue #345). */
import type { PatternVersionListItem } from "@tafsila/schemas";

/** How many versions can be compared at once. */
export const COMPARE_MAX = 2;

/**
 * Adds or removes a tick. A third tick replaces the oldest one.
 *
 * @param picked - Version ids ticked so far, oldest tick first.
 * @param id - The row that changed.
 * @param on - True when it is now ticked.
 * @returns The new ticks.
 */
export function toggleCompare(picked: readonly string[], id: string, on: boolean): readonly string[] {
  const without = picked.filter((p) => p !== id);
  return on ? [...without, id].slice(-COMPARE_MAX) : without;
}

/**
 * The compare link for two ticked versions, the lower version number first; null until two are ticked.
 *
 * @param designId - Design id.
 * @param picked - Ticked version ids.
 * @param versions - The loaded versions, to find their numbers.
 * @returns The path with `a` and `b`, or null.
 */
export function compareHref(
  designId: string,
  picked: readonly string[],
  versions: readonly Pick<PatternVersionListItem, "id" | "versionNo">[],
): string | null {
  if (picked.length !== COMPARE_MAX) return null;
  const chosen = versions.filter((v) => picked.includes(v.id)).sort((x, y) => x.versionNo - y.versionNo);
  const [older, newer] = chosen;
  if (older === undefined || newer === undefined) return null;
  return `/designs/${designId}/versions/compare?a=${older.id}&b=${newer.id}`;
}
