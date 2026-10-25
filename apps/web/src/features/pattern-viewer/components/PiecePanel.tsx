"use client";
/** Side panel with the details of the selected piece: names, cut, size and edges (issue #248, FR-VIEW-02, FR-PAT-02). */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { pieceDetails, type PieceDetails } from "../model/piece-details";
import type { ScenePiece } from "../model/types";

/** Props of {@link PiecePanel}. */
interface PiecePanelProps {
  /** The selected piece, or null for the hint. */
  readonly piece: ScenePiece | null;
  /** Position of the piece in the pattern, 1-based, and the count; shown as "piece 1 of 4". */
  readonly position?: { readonly index: number; readonly total: number };
}

/**
 * The edge rows: id, length and seam allowance.
 *
 * @param props - Component props.
 * @param props.edges - The rows.
 * @returns The table.
 */
function EdgeTable({ edges }: Readonly<{ edges: PieceDetails["edges"] }>): ReactElement {
  const t = useTranslations("patternViewer.piece");
  return (
    <table dir="auto" className="w-full text-sm">
      <caption className="pb-1 text-start font-semibold">{t("edges")}</caption>
      <thead>
        <tr className="text-start text-muted">
          <th scope="col" className="text-start font-normal">
            {t("edge")}
          </th>
          <th scope="col" className="text-start font-normal">
            {t("length")}
          </th>
          <th scope="col" className="text-start font-normal">
            {t("allowance")}
          </th>
        </tr>
      </thead>
      <tbody>
        {edges.map((e) => (
          <tr key={e.id} data-testid={`edge-row-${e.id}`}>
            <th scope="row" className="text-start font-normal">
              <bdi>{e.id}</bdi>
            </th>
            <td>{t("cm", { value: e.lengthCm })}</td>
            <td>{t("cm", { value: e.allowanceCm })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Shows one piece's values; every number comes from the scene, converted to cm.
 *
 * @param props - Component props.
 * @returns The panel.
 */
export function PiecePanel({ piece, position }: Readonly<PiecePanelProps>): ReactElement {
  const t = useTranslations("patternViewer.piece");
  const locale = useLocale() === "ar" ? "ar" : "en";
  if (!piece) {
    return (
      <p data-testid="piece-panel" dir="auto" className="text-sm text-muted">
        {t("empty")}
      </p>
    );
  }
  const d = pieceDetails(piece);
  const other = locale === "ar" ? "en" : "ar";
  return (
    <section data-testid="piece-panel" aria-labelledby="piece-panel-title" className="flex flex-col gap-3">
      <div dir="auto">
        {position ? (
          <p className="text-sm text-muted">
            {t("position", { index: position.index, total: position.total })}
          </p>
        ) : null}
        <h3 id="piece-panel-title" className="text-lg font-semibold">
          {piece.name[locale]}
        </h3>
        <p lang={other} className="text-sm text-muted">
          {piece.name[other]}
        </p>
      </div>
      <p dir="auto" className="font-semibold" data-testid="piece-cut">
        {t(`cut.${d.cutKind}`, { count: d.quantity })} · {t(`fabric.${d.fabric}`)}
        {d.mirror && d.cutKind !== "pair" ? ` · ${t("mirrored")}` : ""}
      </p>
      <dl dir="auto" className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted">{t("width")}</dt>
          <dd data-testid="piece-width">{t("cm", { value: d.widthCm })}</dd>
        </div>
        <div>
          <dt className="text-muted">{t("height")}</dt>
          <dd data-testid="piece-height">{t("cm", { value: d.heightCm })}</dd>
        </div>
      </dl>
      <EdgeTable edges={d.edges} />
    </section>
  );
}
