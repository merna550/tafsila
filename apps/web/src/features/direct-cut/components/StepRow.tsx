"use client";
/** One marking step with its tick box. */
import { Checkbox } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPlanStep } from "@/shared/pattern-preview";

/** Props of {@link StepRow}. */
interface StepRowProps {
  /** The step. */
  readonly step: CutPlanStep;
  /** The step's sentence in the page language, digits already in the shown style. */
  readonly text: string;
  /** Whether the step is ticked. */
  readonly checked: boolean;
  /** Ticks or unticks the step. */
  readonly onToggle: (id: string) => void;
}

/**
 * Renders the row: the box and the numbered sentence share one label, so tapping the sentence ticks too.
 *
 * @param props - The step, its text, state and handler.
 * @returns The list item.
 */
export function StepRow({ step, text, checked, onToggle }: Readonly<StepRowProps>): ReactElement {
  const t = useTranslations("directCut");
  const id = `step-${step.id}`;
  return (
    <li
      className="flex items-start gap-3 rounded-md border border-border bg-surface p-3"
      data-testid="cut-step"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={() => onToggle(step.id)}
        aria-label={t("stepLabel", { no: step.no })}
        className="mt-0.5"
      />
      <label htmlFor={id} className={`min-h-6 flex-1 text-base ${checked ? "text-muted line-through" : ""}`}>
        <b>{step.no}.</b> {text}
      </label>
    </li>
  );
}
