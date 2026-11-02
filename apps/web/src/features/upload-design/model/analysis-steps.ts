/** The three steps shown while a design is analysed and how each looks in a phase (FR-DES-02). */
import type { AnalysisPhase } from "./analysis-view";

/** Steps in order. */
export const STEPS = ["upload", "read", "prepare"] as const;

/** One step of the analysis. */
export type Step = (typeof STEPS)[number];

/** How one step looks. */
export type StepState = "done" | "active" | "waiting" | "failed";

/**
 * Tells how a step looks in a phase: the upload is finished by the time this screen opens.
 *
 * @param step - The step.
 * @param phase - The phase of the whole analysis.
 * @returns The state of the step.
 */
export function stepState(step: Step, phase: AnalysisPhase): StepState {
  if (step === "upload" || phase === "done") return "done";
  if (step === "prepare") return "waiting";
  return phase === "failed" ? "failed" : "active";
}
