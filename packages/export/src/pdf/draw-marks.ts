/** Alignment marks, overlap hint, tile label and footer of a tile page (decision 288). */
import type { AlignMark } from "../tiles/types";
import { drawTurnedLabel } from "./draw-label";
import { toPagePoint } from "./draw-pieces";
import { TILE_TAG_PREFIX, withTag } from "./marked";
import { PDF_STRINGS } from "./strings";
import {
  FOOTER_PT,
  HINT_DASH_PT,
  HINT_GREY,
  HINT_TEXT_PT,
  MARK_GREY,
  MARK_WIDTH_PT,
  TICK_MM,
  TILE_LABEL_PT,
} from "./style";
import type { PageContext } from "./types";
import { mmToPt } from "./units";

/** Gap between the printable edge and the tile label or footer baseline, in mm. */
const LABEL_GAP_MM = 3;
/** Share of the font size from the middle of a line down to its baseline. */
const BASELINE_SHIFT = 0.33;
/** Quarter turn in degrees. */
const QUARTER_TURN = 90;

/**
 * Draws one alignment mark: a dashed hint line along the mark and a short cross tick at each end.
 *
 * @param ctx - The page and its window.
 * @param mark - The mark.
 */
function drawMark(ctx: PageContext, mark: AlignMark): void {
  const { page, frame, window } = ctx;
  const [x1, y1] = toPagePoint(frame, window, mark.from);
  const [x2, y2] = toPagePoint(frame, window, mark.to);
  const vertical = mark.side === "left" || mark.side === "right";
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: MARK_WIDTH_PT,
    color: HINT_GREY,
    dashArray: [...HINT_DASH_PT],
  });
  const half = mmToPt(TICK_MM) / 2;
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ] as const) {
    const [dx, dy] = vertical ? [half, 0] : [0, half];
    page.drawLine({
      start: { x: x - dx, y: y - dy },
      end: { x: x + dx, y: y + dy },
      thickness: MARK_WIDTH_PT,
      color: MARK_GREY,
    });
  }
}

/**
 * Writes the word "overlap" in the middle of an overlap strip, in both languages.
 *
 * @param ctx - The page and its window.
 * @param mark - The mark whose strip is labelled.
 * @param overlapMm - Overlap width in mm; 0 draws nothing.
 */
function drawOverlapWord(ctx: PageContext, mark: AlignMark, overlapMm: number): void {
  const { page, fonts, frame, window } = ctx;
  if (overlapMm <= 0) return;
  const vertical = mark.side === "left" || mark.side === "right";
  const sign = mark.side === "left" || mark.side === "top" ? -1 : 1;
  const mid = { x: (mark.from.x + mark.to.x) / 2, y: (mark.from.y + mark.to.y) / 2 };
  const shift = (sign * overlapMm) / 2;
  const at = vertical ? { x: mid.x + shift, y: mid.y } : { x: mid.x, y: mid.y + shift };
  const [x, y] = toPagePoint(frame, window, at);
  const text = `${PDF_STRINGS.ar.overlap} / ${PDF_STRINGS.en.overlap}`;
  const baseline = vertical
    ? { x: x - HINT_TEXT_PT * BASELINE_SHIFT, y }
    : { x, y: y - HINT_TEXT_PT * BASELINE_SHIFT };
  drawTurnedLabel(page, fonts, text, {
    ...baseline,
    sizePt: HINT_TEXT_PT,
    align: "center",
    rotationDeg: vertical ? -QUARTER_TURN : 0,
  });
}

/**
 * Draws the marks and the overlap hint of a tile. Call before the pieces so the hint sits under them.
 *
 * @param ctx - The page and its window.
 * @param marks - The tile's alignment marks.
 * @param overlapMm - Overlap between neighbours in mm.
 */
export function drawTileMarks(ctx: PageContext, marks: readonly AlignMark[], overlapMm: number): void {
  for (const mark of marks) {
    drawMark(ctx, mark);
    drawOverlapWord(ctx, mark, overlapMm);
  }
}

/** What the footer says. */
export interface FooterInfo {
  /** Design title. */
  readonly title: string;
  /** Version number. */
  readonly versionNo: number;
  /** Engine version. */
  readonly engineVersion: string;
  /** One-based page number. */
  readonly page: number;
  /** Pages in the file. */
  readonly pages: number;
}

/**
 * Draws the tile label in the top margin and the footer in the bottom margin (both outside the printable area).
 *
 * @param ctx - The page and its printable rectangle.
 * @param label - The tile label such as "B2".
 * @param footer - Footer content.
 */
export function drawTileLabelAndFooter(ctx: PageContext, label: string, footer: FooterInfo): void {
  const { page, fonts, frame } = ctx;
  const gap = mmToPt(LABEL_GAP_MM);
  withTag(page, `${TILE_TAG_PREFIX}${label}`, () =>
    drawTurnedLabel(page, fonts, label, {
      x: frame.leftPt,
      y: frame.topPt + gap,
      sizePt: TILE_LABEL_PT,
      bold: true,
      align: "left",
    }),
  );
  const y = frame.topPt - frame.heightPt - gap - FOOTER_PT;
  const info = `v${footer.versionNo} - engine ${footer.engineVersion} - ${footer.page}/${footer.pages}`;
  drawTurnedLabel(page, fonts, footer.title, { x: frame.leftPt, y, sizePt: FOOTER_PT, align: "left" });
  drawTurnedLabel(page, fonts, info, {
    x: frame.leftPt + frame.widthPt,
    y,
    sizePt: FOOTER_PT,
    align: "right",
  });
}
