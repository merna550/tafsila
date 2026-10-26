"use client";
/** The current step of the chosen piece: tapped, else the first unticked (issue #292). */
import { useCallback, useState } from "react";
import type { CutPiecePlan, CutPlanStep } from "@/shared/pattern-preview";
import { currentStepId } from "../model/current-step";
import type { CurrentStepController } from "../model/types";

/** No steps, shared so the array is stable before the plan arrives. */
const NO_STEPS: readonly CutPlanStep[] = [];

/**
 * Keeps the tapped step in plain state; a tapped id from another piece matches no step and is ignored, so the
 * state needs no reset when the piece changes.
 *
 * @param piece - The chosen piece, if the plan has arrived.
 * @param ticked - The ticked step ids.
 * @returns The current step and the handlers.
 */
export function useCurrentStep(
  piece: CutPiecePlan | undefined,
  ticked: ReadonlySet<string>,
): CurrentStepController {
  const [tapped, setTapped] = useState<string | null>(null);
  const clear = useCallback(() => setTapped(null), []);
  const steps = piece?.steps ?? NO_STEPS;
  const id = currentStepId(steps, ticked, tapped);
  return { current: steps.find((s) => s.id === id) ?? null, select: setTapped, clear };
}
