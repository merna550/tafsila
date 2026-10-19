import type { SewingStep } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import type { DraftContext } from "../pipeline/draft-context";
import { SEWING_CATALOGUE, SEWING_KEYS, type SewingTextKey } from "./catalogue";
import { coverageOf } from "./coverage";
import { sewingDrafts } from "./rules";
import { SEWING_PHASES } from "./types";

/**
 * Builds the numbered sewing order of the finished pieces: finds the steps, sorts them by phase and catalogue order,
 * numbers them from 1 and checks that every seam is sewn exactly once (decision 146).
 *
 * @param ctx - The final context.
 * @returns The steps.
 * @throws {DraftingError} `SEWING_PAIR_UNCOVERED` or `SEWING_PAIR_DUPLICATED` (a programming error, like a bad module mix).
 */
export function assembleSewingOrder(ctx: DraftContext): readonly SewingStep[] {
  const drafts = sewingDrafts(ctx)
    .map((d) => ({ ...d, key: d.key as SewingTextKey, entry: SEWING_CATALOGUE[d.key as SewingTextKey] }))
    .sort(
      (a, b) =>
        SEWING_PHASES.indexOf(a.entry.phase) - SEWING_PHASES.indexOf(b.entry.phase) ||
        SEWING_KEYS.indexOf(a.key) - SEWING_KEYS.indexOf(b.key),
    );
  const steps: SewingStep[] = drafts.map((d, index) => ({
    order: index + 1,
    action: d.entry.action,
    edges: [...new Set(d.edges)].sort((x, y) => x.localeCompare(y, "en")),
    text: { ...d.entry.text },
  }));
  const coverage = coverageOf(ctx.pieces, steps);
  if (coverage.uncovered.length > 0) {
    throw new DraftingError(
      "SEWING_PAIR_UNCOVERED",
      `Seams with no sewing step: ${coverage.uncovered.join(", ")}`,
    );
  }
  if (coverage.duplicated.length > 0) {
    throw new DraftingError("SEWING_PAIR_DUPLICATED", `Seams sewn twice: ${coverage.duplicated.join(", ")}`);
  }
  return Object.freeze(steps);
}
