/** Reading the AI's confidence: which level a number is, and which features need the user's eye (FR-DES-04). */
import { LOW_CONFIDENCE, type DesignAnalysisResult, type DesignFeaturePath } from "@tafsila/schemas";

/** At or above this confidence a feature is shown as "high". */
export const HIGH_CONFIDENCE = 0.85;

/** How sure the AI is, as the screen groups it. */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Groups a confidence number.
 *
 * @param value - 0 to 1.
 * @returns "low" below the schema threshold, "high" from 0.85, else "medium".
 */
export function levelOf(value: number): ConfidenceLevel {
  if (value < LOW_CONFIDENCE) return "low";
  return value >= HIGH_CONFIDENCE ? "high" : "medium";
}

/**
 * Turns a confidence into a whole percent.
 *
 * @param value - 0 to 1.
 * @returns 0 to 100.
 */
export function percentOf(value: number): number {
  return Math.round(value * 100);
}

/**
 * Lists the features the AI was unsure of: they must be confirmed before continuing.
 * A feature with no confidence value counts as confirmed (the model gave none).
 *
 * @param result - The analysis.
 * @returns Paths with a confidence below the threshold.
 */
export function lowConfidencePaths(result: DesignAnalysisResult): DesignFeaturePath[] {
  return (Object.entries(result.confidence) as [DesignFeaturePath, number][])
    .filter(([, value]) => value < LOW_CONFIDENCE)
    .map(([path]) => path);
}

/**
 * Tells whether the analysis as a whole is weak: more than half of the scored features are low.
 *
 * @param result - The analysis.
 * @returns True when the "check every feature" banner applies.
 */
export function isWeakOverall(result: DesignAnalysisResult): boolean {
  const total = Object.keys(result.confidence).length;
  return total > 0 && lowConfidencePaths(result).length * 2 > total;
}
