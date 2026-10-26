"use client";
/** The list of pieces with how many steps of each are ticked; choosing one shows its steps. */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPlan } from "@/shared/pattern-preview";
import { pieceProgress } from "../model/ticks";

/** Props of {@link CutPieceList}. */
interface CutPieceListProps {
  /** The plan. */
  readonly plan: CutPlan;
  /** The chosen piece id. */
  readonly currentId: string;
  /** The ticked step ids. */
  readonly ticked: ReadonlySet<string>;
  /** Chooses a piece. */
  readonly onChoose: (pieceId: string) => void;
}

/**
 * Renders the piece list with "3 of 5" progress.
 *
 * @param props - The plan, the chosen piece, the ticks and the handler.
 * @returns The navigation.
 */
export function CutPieceList({
  plan,
  currentId,
  ticked,
  onChoose,
}: Readonly<CutPieceListProps>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  return (
    <nav aria-label={t("pieces")} className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted">{t("pieces")}</h2>
      {plan.pieces.map((piece) => {
        const { done, total } = pieceProgress(piece.steps, ticked);
        const current = piece.pieceId === currentId;
        return (
          <button
            key={piece.pieceId}
            type="button"
            aria-current={current ? "true" : undefined}
            onClick={() => onChoose(piece.pieceId)}
            data-testid="cut-piece"
            className={`flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 text-start text-base font-semibold focus-visible:outline-2 focus-visible:outline-focus ${
              current ? "border-primary bg-surface-hover text-primary" : "border-border bg-surface text-text"
            }`}
          >
            <span>{piece.name[locale]}</span>
            <span className="text-sm font-normal text-muted" data-testid="cut-piece-progress">
              {t("progress", { done, total })}
            </span>
          </button>
        );
      })}
      <p className="text-sm text-muted">{t("storedLocally")}</p>
    </nav>
  );
}
