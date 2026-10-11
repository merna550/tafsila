/** Start from a standard size and change a few values (FR-MEAS-01, FR-MEAS-05). */
import type { Measurements, SizeChart } from "@tafsila/schemas";

/** Thrown when the requested size label is not in the chart (a programming error: the UI offers charted sizes only). */
export class UnknownSizeError extends Error {
  /**
   * Creates the error for a missing size label.
   *
   * @param label - The label that was asked for.
   */
  constructor(public readonly label: string) {
    super(`Unknown size "${label}"`);
    this.name = "UnknownSizeError";
  }
}

/**
 * Returns the chart row for `label` with `overrides` on top.
 * Keys that are `undefined` in `overrides` do not erase values. Inputs are never mutated.
 *
 * @param chart - Size chart (label to measurements).
 * @param label - Size to start from.
 * @param overrides - Values the user changed.
 * @returns A new `Measurements` object.
 * @throws {UnknownSizeError} when `label` is not in the chart.
 */
export function fromStandardSize(
  chart: SizeChart,
  label: string,
  overrides: Partial<Measurements> = {},
): Measurements {
  const base = Object.hasOwn(chart, label) ? chart[label] : undefined;
  if (!base) throw new UnknownSizeError(label);
  const result: Measurements = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value != null) Object.assign(result, { [key]: value });
  }
  return result;
}
