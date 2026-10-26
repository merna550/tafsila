"use client";
/** The working area for the chosen piece: the piece list beside the reference, the curve step, the steps and the drawing. */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPiecePlan, CutPlan } from "@/shared/pattern-preview";
import type { CutSettings, TicksController } from "../model/types";
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
  settings,
  onChoosePiece,
}: Readonly<PieceWorkspaceProps>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  const { done, total } = pieceProgress(piece.steps, ticks.ticked);
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
          <StepList piece={piece} ticked={ticks.ticked} onToggle={ticks.toggle} />
        </div>
        <div className="flex flex-col gap-2 lg:sticky lg:top-4 lg:w-96 lg:flex-none">
          <h2 className="text-sm font-semibold text-muted">{t("diagramTitle")}</h2>
          <PieceDiagram piece={piece} label={t("diagramLabel", { piece: piece.name[locale] })} />
          <p className="text-sm text-muted">{t("diagramCaption", { step: plan.curveStepMm })}</p>
        </div>
      </div>
    </div>
  );
}
