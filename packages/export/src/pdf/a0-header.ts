/** The A0 header band: test square, title block, print notes and page map at the top of sheet 1 (decision 290). */
import { SHEET_MARGIN_MM } from "@tafsila/engine";
import type { PDFPage } from "pdf-lib";
import type { Point } from "@tafsila/schemas";
import type { TileInput, Tiling } from "../tiles/types";
import { drawPageMap, drawTestSquare, drawTitleBlock, TEST_SQUARE_MM } from "./draw-cover";
import { drawTurnedLabel } from "./draw-label";
import type { EmbeddedFonts } from "./fonts";
import { PDF_STRINGS } from "./strings";
import type { PageContext, PdfMeta } from "./types";
import { mmToPt } from "./units";
import { toPagePoint } from "./draw-pieces";

/** Height of the header band: the 100 mm test square plus 40 mm of margins (decision 290). */
export const A0_HEADER_MM = 140;
/** Width of the header band: the square, the text column (title up to ~210 mm) and the page map. */
export const A0_HEADER_WIDTH_MM = 600;
/** Space around the test square inside the band, in mm. */
const PAD_MM = (A0_HEADER_MM - TEST_SQUARE_MM) / 2;
/** Gap between the square and the text column, in mm. */
const TEXT_GAP_MM = 15;
/** Left edge of the text column, from the band's left edge, in mm. */
const TEXT_LEFT_MM = PAD_MM + TEST_SQUARE_MM + TEXT_GAP_MM;
/** Left edge of the page map, from the band's left edge, in mm. */
const MAP_LEFT_MM = 420;
/** Room for the page map, in mm. */
const MAP_SIZE = { widthMm: 160, heightMm: 95 };
/** Baseline of the title, from the band's top, in mm. */
const TITLE_Y_MM = 32;
/** Baseline of the first note pair, from the band's top, in mm. */
const NOTE_START_MM = 78;
/** Distance between the two lines of a note pair (Arabic, English), in mm. */
const NOTE_LINE_MM = 7;
/** Distance between note pairs (measure, print at 100 %, ask the shop), in mm. */
const NOTE_PAIR_MM = 21;
/** Font size of the notes in points. */
const NOTE_PT = 10;

/**
 * Reserves the header band on a tile input: the pieces move down by the band and the band is part of the area, so
 * the tiler gives sheet 1 room for it (decision 290).
 *
 * @param input - The tile input of the pattern.
 * @returns The input with the band; the header rectangle is an outline so its tile is never skipped.
 */
export function withHeaderBand(input: TileInput): TileInput {
  const { area } = input;
  const moved = input.outlines.map((o) => o.map((p): Point => ({ x: p.x, y: p.y + A0_HEADER_MM })));
  const [x0, y0] = [area.minX, area.minY];
  const x1 = Math.max(area.maxX, x0 + A0_HEADER_WIDTH_MM);
  const band: Point[] = [
    { x: x0, y: y0 },
    { x: x0 + A0_HEADER_WIDTH_MM, y: y0 },
    { x: x0 + A0_HEADER_WIDTH_MM, y: y0 + A0_HEADER_MM },
    { x: x0, y: y0 + A0_HEADER_MM },
  ];
  return { area: { ...area, maxX: x1, maxY: area.maxY + A0_HEADER_MM }, outlines: [...moved, band] };
}

/**
 * Draws the six note lines (Arabic then English for each of: measure, print at 100 %, ask the shop).
 *
 * @param page - The page.
 * @param fonts - Embedded fonts.
 * @param x - Left edge of the text column in points.
 * @param top - Top of the band in points.
 */
function drawNotes(page: PDFPage, fonts: EmbeddedFonts, x: number, top: number): void {
  const { ar, en } = PDF_STRINGS;
  const texts = [ar.measure, en.measure, ar.printActual, en.printActual, ar.shopPrint, en.shopPrint];
  texts.forEach((text, i) =>
    drawTurnedLabel(page, fonts, text, {
      x,
      y: top - mmToPt(NOTE_START_MM + Math.floor(i / 2) * NOTE_PAIR_MM + (i % 2) * NOTE_LINE_MM),
      sizePt: NOTE_PT,
      bold: i < 2,
      align: "left",
    }),
  );
}

/**
 * Draws the header band on the page of sheet 1. The page map appears only when the file has several sheets.
 *
 * @param ctx - The page of the top-left tile, with that tile's window.
 * @param meta - The PDF metadata.
 * @param tiling - The A0 tiling.
 */
export function drawA0Header(ctx: PageContext, meta: PdfMeta, tiling: Tiling): void {
  const { page, fonts } = ctx;
  const [left, top] = toPagePoint(ctx.frame, ctx.window, { x: SHEET_MARGIN_MM, y: SHEET_MARGIN_MM });
  drawTestSquare(page, left + mmToPt(PAD_MM), top - mmToPt(PAD_MM));
  const textX = left + mmToPt(TEXT_LEFT_MM);
  drawTitleBlock(page, fonts, meta, { xPt: textX, yPt: top - mmToPt(TITLE_Y_MM) });
  drawNotes(page, fonts, textX, top);
  if (tiling.printed.length > 1) {
    drawPageMap(page, fonts, tiling, {
      leftPt: left + mmToPt(MAP_LEFT_MM),
      topPt: top - mmToPt(PAD_MM),
      ...MAP_SIZE,
    });
  }
}
