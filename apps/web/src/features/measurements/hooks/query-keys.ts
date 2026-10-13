/** Query keys of the measurements feature. */

/** Key of the default size chart (never changes during a session). */
const DEFAULT_CHART = ["size-charts", "default"] as const;

/**
 * Key of one measurement set.
 *
 * @param id - Set id.
 * @returns The query key.
 */
function set(id: string): readonly ["measurement-set", string] {
  return ["measurement-set", id] as const;
}

/** All query keys of the feature. */
export const measurementKeys = { defaultChart: DEFAULT_CHART, set };
