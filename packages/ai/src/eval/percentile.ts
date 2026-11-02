/** Percentiles for the evaluation's latency figures (issue #338, NFR-02). */

/**
 * The nearest-rank percentile: the smallest value with at least q % of the values at or below it. With 50 photos the
 * p95 is the 48th fastest call, an observed latency rather than an interpolated one.
 *
 * @param values - The observations, in any order.
 * @param q - The percentile, 0 < q ≤ 100.
 * @returns The value, or null when there are no observations.
 * @throws {RangeError} When q is outside (0, 100].
 * @example
 * percentile([1, 2, 3, 4], 50); // 2
 */
export function percentile(values: readonly number[], q: number): number | null {
  if (!(q > 0 && q <= 100)) throw new RangeError(`percentile must be in (0, 100], got ${q}`);
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.ceil((q / 100) * sorted.length) - 1] ?? null;
}
