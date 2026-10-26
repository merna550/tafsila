"use client";
/** The working area for the chosen piece: the piece list beside the reference, the curve step, the steps and the drawing. */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPiecePlan, CutPlan } from "@/shared/pattern-preview";
import type { CurrentStepController, CutSettings, TicksController } from "../model/types";
import { highlightOf } from "../model/steps";
import { pieceProgress } from "../model/ticks";
import { CurveStepSelect } from "./CurveStepSelect";
import { CutPieceList } from "./CutPieceList";
import { PieceDiagram } from "./PieceDiagram";
import { ReferenceLines } from "./ReferenceLines";
import { StepList } from "./StepList";

/** Props of {@link PieceWorkspace}. */
interface PieceWorkspaceProps {
  /** The plan. */
  readonly plan: CutPlan;
  /** The chosen piece. */
  readonly piece: CutPiecePlan;
  /** The ticks. */
  readonly ticks: TicksController;
  /** The current step. */
  readonly current: CurrentStepController;
  /** The curve step setting. */
  readonly settings: CutSettings;
  /** Chooses a piece. */
  readonly onChoosePiece: (pieceId: string) => void;
}

/**
 * Renders the workspace; a "piece done" notice shows when every step of the piece is ticked.
 *
 * @param props - The plan, the chosen piece, the ticks and the setting.
 * @returns The workspace.
 */
export function PieceWorkspace({
  plan,
  piece,
  ticks,
  current: step,
  settings,
  onChoosePiece,
}: Readonly<PieceWorkspaceProps>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  const { done, total } = pieceProgress(piece.steps, ticks.ticked);
  /**
   * Ticks or unticks a step and lets the current step move on.
   *
   * @param id - The step id.
   */
  const toggle = (id: string): void => {
    ticks.toggle(id);
    step.clear();
  };
  const pieceDone = total > 0 && done === total;
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <aside className="md:w-64 md:flex-none">
        <CutPieceList plan={plan} currentId={piece.pieceId} ticked={ticks.ticked} onChoose={onChoosePiece} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <ReferenceLines piece={piece} />
          <CurveStepSelect value={settings.curveStepMm} onChange={settings.setCurveStepMm} />
          {pieceDone ? (
            <div
              role="status"
              className="rounded-md border border-success bg-surface p-3 font-semibold text-success"
            >
              {t("pieceDone", { piece: piece.name[locale] })}
            </div>
          ) : null}
          <StepList
            piece={piece}
            ticked={ticks.ticked}
            onToggle={toggle}
            currentId={step.current?.id ?? null}
            onSelect={step.select}
          />
        </div>
        <div className="sticky top-0 z-10 order-first flex flex-col gap-2 bg-background lg:top-4 lg:order-none lg:w-96 lg:flex-none [&_svg]:max-h-40 lg:[&_svg]:max-h-96">
          <h2 className="hidden text-sm font-semibold text-muted lg:block">{t("diagramTitle")}</h2>
          <PieceDiagram
            piece={piece}
            label={t("diagramLabel", { piece: piece.name[locale] })}
            highlight={step.current ? highlightOf([step.current]) : null}
            locale={locale}
            digits="western"
          />
          <p className="hidden text-sm text-muted lg:block">
            {t("diagramCaption", { step: plan.curveStepMm })}
          </p>
        </div>
      </div>
    </div>
  );
}
