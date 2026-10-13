/** How a measurement set is entered: from a standard size or fully custom. */
import type { MeasurementSet } from "@tafsila/schemas";

/** The two start modes. */
export type StartMode = "size" | "custom";

/**
 * Picks the start mode a set opens in: a saved set without a size opens in "custom".
 *
 * @param set - The set being edited, if any.
 * @returns The mode.
 */
export function startModeOf(set: MeasurementSet | undefined): StartMode {
  return set && !set.sizeLabel ? "custom" : "size";
}
