/** What the diagram highlights, for one step or one printed group of steps (issue #292). */
import type { CutPlanGuide, CutPlanStep, CutStepGroup } from "@/shared/pattern-preview";

/** The points and distance segments drawn highlighted. */
export interface Highlight {
  /** Ids of the highlighted points. */
  readonly pointIds: readonly string[];
  /** The distance segments drawn with their length. */
  readonly guides: readonly CutPlanGuide[];
}

/** The printed groups, in the order they print. */
export const STEP_GROUPS: readonly CutStepGroup[] = ["corners", "curves", "marks"];

/**
 * The union of the points and guides of some steps.
 *
 * @param steps - One step or the steps of a group.
 * @returns What to highlight; points are listed once, in first-seen order.
 */
export function highlightOf(steps: readonly CutPlanStep[]): Highlight {
  return {
    pointIds: [...new Set(steps.flatMap((s) => s.pointIds))],
    guides: steps.flatMap((s) => s.guides),
  };
}

/**
 * The groups of a piece that have points to show, each with its highlight.
 *
 * @param steps - The piece's steps.
 * @returns Up to three entries, in print order.
 */
export function groupHighlights(
  steps: readonly CutPlanStep[],
): readonly { readonly group: CutStepGroup; readonly highlight: Highlight }[] {
  return STEP_GROUPS.map((group) => ({
    group,
    highlight: highlightOf(steps.filter((s) => s.group === group)),
  })).filter((entry) => entry.highlight.pointIds.length > 0);
}
