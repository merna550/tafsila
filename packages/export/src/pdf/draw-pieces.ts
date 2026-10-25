/** Draws the pieces of the scene that fall in one tile window, at 1:1 (decision 288). */
import { clip, endPath, popGraphicsState, pushGraphicsState, rectangle } from "pdf-lib";
import type { PatternScene, Rect, ScenePiece } from "@tafsila/engine";
import { SCALE_SQUARE_MM } from "@tafsila/engine";
import type { Point } from "@tafsila/schemas";
import { drawTurnedLabel } from "./draw-label";
import {
  CUT_WIDTH_PT,
  INK,
  INK_SOFT,
  MARK_WIDTH_PT,
  STITCH_DASH_PT,
  STITCH_WIDTH_PT,
  userUnits,
} from "./style";
import type { PageContext, PageFrame } from "./types";
import { MM_TO_PT } from "./units";

/** A label's text height is never drawn smaller than this, in points. */
const MIN_LABEL_PT = 5;

/**
 * Where a sheet point lands on the page.
 *
 * @param frame - The printable rectangle of the page.
 * @param window - The part of the sheet the page shows, in sheet mm.
 * @param p - A point in sheet mm.
 * @returns The page point in PDF points (y up).
 */
export function toPagePoint(frame: PageFrame, window: Rect, p: Point): [number, number] {
  return [frame.leftPt + (p.x - window.minX) * MM_TO_PT, frame.topPt - (p.y - window.minY) * MM_TO_PT];
}

/**
 * True when a piece's cut-line box touches the window.
 *
 * @param piece - The piece.
 * @param w - The window.
 * @returns Whether it must be drawn on this page.
 */
function touches(piece: ScenePiece, w: Rect): boolean {
  const { x, y } = piece.cell;
  return (
    x <= w.maxX && x + piece.bboxMm.widthMm >= w.minX && y <= w.maxY && y + piece.bboxMm.heightMm >= w.minY
  );
}

/**
 * Draws one SVG path string (in sheet mm) on the page at 1:1.
 *
 * @param ctx - The page and its window.
 * @param d - Path data in sheet mm.
 * @param style - Line width in points, colour and optional dash in points.
 */
function strokePath(
  ctx: PageContext,
  d: string,
  style: { widthPt: number; color: typeof INK; dashPt?: readonly [number, number] },
): void {
  if (d === "") return;
  const [x, y] = toPagePoint(ctx.frame, ctx.window, { x: 0, y: 0 });
  ctx.page.drawSvgPath(d, {
    x,
    y,
    scale: MM_TO_PT,
    borderWidth: userUnits(style.widthPt),
    borderColor: style.color,
    ...(style.dashPt ? { borderDashArray: style.dashPt.map(userUnits) } : {}),
  });
}

/**
 * Draws one piece: cut, stitch, grain, notches, darts and labels.
 *
 * @param ctx - The page and its window.
 * @param piece - The piece.
 */
function drawPiece(ctx: PageContext, piece: ScenePiece): void {
  strokePath(ctx, piece.cutD, { widthPt: CUT_WIDTH_PT, color: INK });
  strokePath(ctx, piece.stitchD, { widthPt: STITCH_WIDTH_PT, color: INK_SOFT, dashPt: STITCH_DASH_PT });
  strokePath(ctx, piece.grainD, { widthPt: MARK_WIDTH_PT, color: INK });
  for (const n of piece.notches) strokePath(ctx, n.d, { widthPt: CUT_WIDTH_PT, color: INK });
  for (const d of piece.darts) strokePath(ctx, d.d, { widthPt: MARK_WIDTH_PT, color: INK_SOFT });
  for (const label of piece.labels) {
    const [x, y] = toPagePoint(ctx.frame, ctx.window, label.at);
    drawTurnedLabel(ctx.page, ctx.fonts, label.text.ar, {
      x,
      y,
      sizePt: Math.max(MIN_LABEL_PT, label.sizeMm * MM_TO_PT),
      rotationDeg: label.rotationDeg,
      align: "center",
    });
  }
}

/**
 * Draws the sheet's own scale square outline.
 *
 * @param ctx - The page and its window.
 * @param corner - Top-left of the square in sheet mm.
 */
function drawScaleSquare(ctx: PageContext, corner: Point): void {
  const s = SCALE_SQUARE_MM;
  const d = `M ${corner.x} ${corner.y} L ${corner.x + s} ${corner.y} L ${corner.x + s} ${corner.y + s} L ${corner.x} ${corner.y + s} Z`;
  strokePath(ctx, d, { widthPt: CUT_WIDTH_PT, color: INK });
}

/**
 * Draws everything of the scene that falls in the context's window, clipped to the printable rectangle. The caller
 * draws marks before (under) and the tile label after this call. The same function serves A4 and A0.
 *
 * @param ctx - The page, fonts, printable rectangle and sheet window.
 * @param scene - The scene, in sheet mm.
 * @param scaleSquare - Top-left of the sheet's scale square, when the sheet has one.
 */
export function drawPiecesInWindow(ctx: PageContext, scene: PatternScene, scaleSquare?: Point): void {
  const { page, frame, window } = ctx;
  page.pushOperators(
    pushGraphicsState(),
    rectangle(frame.leftPt, frame.topPt - frame.heightPt, frame.widthPt, frame.heightPt),
    clip(),
    endPath(),
  );
  for (const piece of scene.pieces) if (touches(piece, window)) drawPiece(ctx, piece);
  if (scaleSquare) drawScaleSquare(ctx, scaleSquare);
  page.pushOperators(popGraphicsState());
}
