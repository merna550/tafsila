/** Compares two option values field by field (the seam allowances are a small record). */
import type { PatternOptionsValue } from "@/features/pattern-options";

/**
 * Tells whether two option values hold the same choices.
 *
 * @param a - First value, or null.
 * @param b - Second value, or null.
 * @returns True when both are null or every field matches.
 */
export function optionsEqual(a: PatternOptionsValue | null, b: PatternOptionsValue | null): boolean {
  if (a === null || b === null) return a === b;
  const kinds = Object.keys(a.seamAllowanceMm) as (keyof PatternOptionsValue["seamAllowanceMm"])[];
  return (
    a.clientId === b.clientId &&
    a.measurementSetId === b.measurementSetId &&
    a.easeProfile === b.easeProfile &&
    a.fabricWidthMm === b.fabricWidthMm &&
    kinds.every((kind) => a.seamAllowanceMm[kind] === b.seamAllowanceMm[kind])
  );
}
