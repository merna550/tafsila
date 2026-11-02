/** The analysing card: three steps (upload, read, prepare) and the note for the phase (FR-DES-02). */
import { Spinner } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { AnalysisPhase } from "../model/analysis-view";
import { stepState, STEPS, type StepState } from "../model/analysis-steps";

/** Props for {@link AnalysisSteps}. */
interface AnalysisStepsProps {
  readonly phase: AnalysisPhase;
}

/** Accessible label key per step state. */
const STATE_LABEL: Record<StepState, "stepDone" | "stepActive" | "stepFailed"> = {
  done: "stepDone",
  active: "stepActive",
  waiting: "stepActive",
  failed: "stepFailed",
};

/** Look of the round mark per step state. */
const MARK_CLASS: Record<StepState, string> = {
  done: "bg-success text-on-primary",
  active: "",
  waiting: "border border-line",
  failed: "bg-danger text-on-primary",
};

/** Text inside the round mark per step state. */
const MARK_TEXT: Record<StepState, string> = { done: "✓", active: "", waiting: "", failed: "!" };

/**
 * Renders the three steps with their marks.
 *
 * @param props - The phase.
 * @returns The ordered list.
 */
export function AnalysisSteps({ phase }: Readonly<AnalysisStepsProps>): ReactElement {
  const t = useTranslations("uploadDesign.analysing");
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
      {STEPS.map((step) => {
        const state = stepState(step, phase);
        const label = t(STATE_LABEL[state]);
        return (
          <li key={step} data-step={step} data-state={state} className="flex items-center gap-2.5 text-base">
            {state === "active" ? (
              <Spinner label={label} className="size-5" />
            ) : (
              <span
                aria-label={label}
                className={`flex size-5 items-center justify-center rounded-full text-xs font-bold ${MARK_CLASS[state]}`}
              >
                {MARK_TEXT[state]}
              </span>
            )}
            <span className={state === "waiting" ? "text-muted" : ""}>{t(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}
