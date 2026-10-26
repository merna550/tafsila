"use client";
/** The numbered steps of one piece with their tick boxes. */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPiecePlan } from "@/shared/pattern-preview";
import { showText } from "../model/format";
import { StepRow } from "./StepRow";

/** Props of {@link StepList}. */
interface StepListProps {
  /** The piece whose steps are shown. */
  readonly piece: CutPiecePlan;
  /** The ticked step ids. */
  readonly ticked: ReadonlySet<string>;
  /** Ticks or unticks a step. */
  readonly onToggle: (id: string) => void;
}

/**
 * Renders the ordered list.
 *
 * @param props - The piece, the ticks and the handler.
 * @returns The list.
 */
export function StepList({ piece, ticked, onToggle }: Readonly<StepListProps>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  return (
    <ol aria-label={t("steps")} className="flex flex-col gap-2">
      {piece.steps.map((step) => (
        <StepRow
          key={step.id}
          step={step}
          text={showText(step.text, locale)}
          checked={ticked.has(step.id)}
          onToggle={onToggle}
        />
      ))}
    </ol>
  );
}
