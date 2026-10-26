/** Which step of a piece is "current": the one drawn highlighted on the diagram (issue #292). */
import type { CutPlanStep } from "@/shared/pattern-preview";

/**
 * The current step: the tapped one while it still exists, otherwise the first unticked step, otherwise none.
 *
 * @param steps - The piece's steps, in order.
 * @param ticked - The ticked step ids.
 * @param tappedId - The step the tailor tapped or focused last, or `null`.
 * @returns The current step id, or `null` when every step is ticked.
 */
export function currentStepId(
  steps: readonly CutPlanStep[],
  ticked: ReadonlySet<string>,
  tappedId: string | null,
): string | null {
  if (tappedId !== null && steps.some((s) => s.id === tappedId)) return tappedId;
  return steps.find((s) => !ticked.has(s.id))?.id ?? null;
}
