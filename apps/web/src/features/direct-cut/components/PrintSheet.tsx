"use client";
/** The printable checklist: every piece on its own page with empty boxes (it never reads the ticks), the title block and the reference drawing. */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { CutPiecePlan, CutPlan } from "@/shared/pattern-preview";
import { showText } from "../model/format";
import { groupHighlights } from "../model/steps";
import { PieceDiagram } from "./PieceDiagram";

/** Props of {@link PrintSheet}. */
interface PrintSheetProps {
  /** The plan. */
  readonly plan: CutPlan;
  /** The design title. */
  readonly title: string;
  /** Version number. */
  readonly versionNo: number;
  /** Size label of the version. */
  readonly sizeLabel: string;
}

/**
 * The small diagrams of one piece, one per step group that has points.
 *
 * @param props - The piece.
 * @param props.piece - The piece.
 * @returns The diagrams.
 */
function GroupDiagrams({ piece }: Readonly<{ piece: CutPiecePlan }>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  return (
    <div className="grid grid-cols-3 gap-2">
      {groupHighlights(piece.steps).map(({ group, highlight }) => (
        <figure key={group} className="m-0" data-testid="print-group-diagram">
          <PieceDiagram
            piece={piece}
            label={t("diagram.group", { piece: piece.name[locale], group: t(`diagram.groups.${group}`) })}
            highlight={highlight}
            locale={locale}
            digits="western"
          />
          <figcaption className="text-center text-xs">{t(`diagram.groups.${group}`)}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/**
 * Renders the sheet. Borders, not fills, draw the boxes because browsers print backgrounds off.
 *
 * @param props - The plan and the title block data.
 * @returns The sheet.
 */
export function PrintSheet({ plan, title, versionNo, sizeLabel }: Readonly<PrintSheetProps>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as "ar" | "en";
  return (
    <article className="flex flex-col gap-6 bg-white text-black" data-testid="print-sheet">
      {plan.pieces.map((piece) => (
        <section
          key={piece.pieceId}
          className="flex flex-col gap-3 [break-after:page] last:[break-after:auto]"
          data-testid="print-piece"
        >
          <header className="flex items-start justify-between gap-4 border-b border-black pb-2">
            <div>
              <div className="text-lg font-semibold">{title}</div>
              <div className="text-sm">{t("print.sizeLine", { size: sizeLabel })}</div>
            </div>
            <div className="text-end text-sm" data-testid="print-version">
              {t("meta", { n: versionNo, engine: plan.engineVersion })}
            </div>
          </header>
          <h2 className="text-base font-semibold">
            {piece.name[locale]} · {t("cutCount", { count: piece.cutCount })}
            {piece.onFold ? ` ${t("onFold")}` : ""}
          </h2>
          <p className="text-sm">{showText(piece.reference.text, locale)}</p>
          <ol className="flex flex-col gap-2">
            {piece.steps.map((step) => (
              <li key={step.id} className="flex items-start gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-0.5 size-5 flex-none border border-black"
                  data-testid="print-box"
                />
                <span>
                  <b>{step.no}.</b> {showText(step.text, locale)}
                </span>
              </li>
            ))}
          </ol>
          <GroupDiagrams piece={piece} />
          <p className="text-sm">{t("print.caption", { step: plan.curveStepMm })}</p>
        </section>
      ))}
    </article>
  );
}
