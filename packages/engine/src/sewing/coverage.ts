import type { PatternResult } from "@tafsila/schemas";
import { edgeRef, pairKey, uniqueEdgePairs } from "../pieces/edge-pairs";
import type { PieceDraft } from "../pipeline/draft-context";

/** The outcome of checking that every seam is sewn exactly once. */
export interface SewingCoverage {
  /** True when no seam is missing or sewn twice. */
  readonly ok: boolean;
  /** Seams (`a|b`) no `sew` or `attach` step covers. */
  readonly uncovered: readonly string[];
  /** Seams (`a|b`) more than one `sew` or `attach` step covers. */
  readonly duplicated: readonly string[];
}

/**
 * Counts, for each seam, the sew and attach steps that name both of its edges (FR-PAT-06, AC 1).
 *
 * @param pieces - The pieces with their pairings.
 * @param steps - The numbered steps.
 * @returns The coverage.
 */
export function coverageOf(
  pieces: readonly PieceDraft[],
  steps: PatternResult["sewingOrder"],
): SewingCoverage {
  const uncovered: string[] = [];
  const duplicated: string[] = [];
  for (const { piece, edge, targetRef } of uniqueEdgePairs(pieces)) {
    const source = edgeRef(piece.id, edge.id);
    const count = steps.filter(
      (step) =>
        (step.action === "sew" || step.action === "attach") &&
        step.edges.includes(source) &&
        step.edges.includes(targetRef),
    ).length;
    if (count === 0) uncovered.push(pairKey(source, targetRef));
    if (count > 1) duplicated.push(pairKey(source, targetRef));
  }
  return { ok: uncovered.length === 0 && duplicated.length === 0, uncovered, duplicated };
}

/**
 * Checks a finished pattern result: every paired seam is sewn in exactly one step.
 *
 * @param result - The engine output.
 * @returns The coverage.
 */
export function sewingCoverage(result: Pick<PatternResult, "pieces" | "sewingOrder">): SewingCoverage {
  return coverageOf(result.pieces, result.sewingOrder);
}
