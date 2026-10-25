/** Page 1 of the A4 file: test square, page map and title block (decision 288). */
import { popGraphicsState, pushGraphicsState, rectangle, stroke, type PDFPage } from "pdf-lib";
import { pageMap } from "../tiles/page-map";
import type { Tiling } from "../tiles/types";
import { drawTurnedLabel } from "./draw-label";
import type { EmbeddedFonts } from "./fonts";
import { MAP_EMPTY_TAG_PREFIX, MAP_TAG_PREFIX, withTag } from "./marked";
import { PDF_STRINGS } from "./strings";
import { INK, MARK_GREY, MARK_WIDTH_PT } from "./style";
import type { PdfMeta } from "./types";
import { A4_PT, mmToPt } from "./units";

/** Side of the test square in mm. */
export const TEST_SQUARE_MM = 100;
/** Name of the marked-content block that holds the test square, so tests can read it back. */
export const TEST_SQUARE_TAG = "TestSquare";
/** Left and right margin of the cover in mm. */
const SIDE_MM = 15;
/** Top of the title in mm from the top edge. */
const TITLE_TOP_MM = 22;
/** Top of the test square in mm from the top edge. */
const SQUARE_TOP_MM = 52;
/** Title size in points. */
const TITLE_PT = 20;
/** Detail line size in points. */
const DETAIL_PT = 10;
/** Caption size in points. */
const CAPTION_PT = 11;
/** Room for the page map, in mm. */
const MAP_BOX = { widthMm: 180, heightMm: 80 };
/** Top of the map in mm from the top edge. */
const MAP_TOP_MM = 185;
/** Distance of the print line from the top edge, in mm. */
const PRINT_LINE_MM = 283;
/** Gap between text lines in mm. */
const LINE_MM = 6;
/** Largest tile label size inside the map, in points. */
const MAP_LABEL_MAX_PT = 14;
/** Smallest tile label size inside the map, in points. */
const MAP_LABEL_MIN_PT = 4;
/** Share of the font size from the middle of a line down to its baseline (centres a label vertically). */
const BASELINE_SHIFT = 0.33;
/** Share of a map tile's shorter side that the label may fill. */
const MAP_LABEL_FILL = 0.4;

/**
 * Page y of a distance from the top edge.
 *
 * @param mm - Distance from the top, in mm.
 * @returns The y in points.
 */
const fromTop = (mm: number): number => A4_PT.height - mmToPt(mm);

/**
 * Draws the 100 mm square inside a marked-content block.
 *
 * @param page - The cover page.
 * @param leftMm - Left edge in mm.
 * @param topMm - Top edge in mm from the top of the page.
 */
function drawTestSquare(page: PDFPage, leftMm: number, topMm: number): void {
  const side = mmToPt(TEST_SQUARE_MM);
  withTag(page, TEST_SQUARE_TAG, () =>
    page.pushOperators(
      pushGraphicsState(),
      rectangle(mmToPt(leftMm), fromTop(topMm) - side, side, side),
      stroke(),
      popGraphicsState(),
    ),
  );
}

/**
 * Draws the title, version, client and engine lines.
 *
 * @param page - The cover page.
 * @param fonts - Embedded fonts.
 * @param meta - The PDF metadata.
 */
function drawTitleBlock(page: PDFPage, fonts: EmbeddedFonts, meta: PdfMeta): void {
  const x = mmToPt(SIDE_MM);
  drawTurnedLabel(page, fonts, meta.title, {
    x,
    y: fromTop(TITLE_TOP_MM),
    sizePt: TITLE_PT,
    bold: true,
    align: "left",
  });
  const lines = [
    `${PDF_STRINGS.en.version}: ${meta.versionNo}`,
    ...(meta.clientLabel ? [`${PDF_STRINGS.en.client}: ${meta.clientLabel}`] : []),
    `${PDF_STRINGS.en.engine}: ${meta.engineVersion}`,
  ];
  lines.forEach((text, i) =>
    drawTurnedLabel(page, fonts, text, {
      x,
      y: fromTop(TITLE_TOP_MM + (i + 1) * LINE_MM),
      sizePt: DETAIL_PT,
      align: "left",
    }),
  );
}

/**
 * Draws the page map: one rectangle per tile with its label, empty tiles crossed out.
 *
 * @param page - The cover page.
 * @param fonts - Embedded fonts.
 * @param tiling - The tiling.
 */
function drawPageMap(page: PDFPage, fonts: EmbeddedFonts, tiling: Tiling): void {
  const map = pageMap(tiling, MAP_BOX);
  const left = mmToPt(SIDE_MM);
  const top = fromTop(MAP_TOP_MM);
  drawTurnedLabel(page, fonts, `${PDF_STRINGS.ar.pageMap} / ${PDF_STRINGS.en.pageMap}`, {
    x: left,
    y: top + mmToPt(LINE_MM / 2),
    sizePt: CAPTION_PT,
    bold: true,
    align: "left",
  });
  for (const t of map.tiles) {
    const [x, w] = [left + mmToPt(t.rect.minX), mmToPt(t.rect.maxX - t.rect.minX)];
    const [h, y] = [mmToPt(t.rect.maxY - t.rect.minY), top - mmToPt(t.rect.maxY)];
    withTag(page, `${t.empty ? MAP_EMPTY_TAG_PREFIX : MAP_TAG_PREFIX}${t.label}`, () => {
      page.drawRectangle({ x, y, width: w, height: h, borderWidth: MARK_WIDTH_PT, borderColor: MARK_GREY });
      const size = Math.max(MAP_LABEL_MIN_PT, Math.min(MAP_LABEL_MAX_PT, Math.min(w, h) * MAP_LABEL_FILL));
      drawTurnedLabel(page, fonts, t.label, {
        x: x + w / 2,
        y: y + h / 2 - size * BASELINE_SHIFT,
        sizePt: size,
        align: "center",
      });
      if (t.empty) {
        page.drawLine({ start: { x, y }, end: { x: x + w, y: y + h }, thickness: MARK_WIDTH_PT, color: INK });
        page.drawLine({ start: { x, y: y + h }, end: { x: x + w, y }, thickness: MARK_WIDTH_PT, color: INK });
      }
    });
  }
  const noteY = top - mmToPt(map.heightMm) - mmToPt(LINE_MM);
  drawTurnedLabel(page, fonts, `${PDF_STRINGS.ar.emptyNote} / ${PDF_STRINGS.en.emptyNote}`, {
    x: left,
    y: noteY,
    sizePt: DETAIL_PT - 2,
    align: "left",
  });
}

/**
 * Draws the whole cover page.
 *
 * @param page - The first page.
 * @param fonts - Embedded fonts.
 * @param meta - The PDF metadata.
 * @param tiling - The A4 tiling of the pattern.
 */
export function drawCover(page: PDFPage, fonts: EmbeddedFonts, meta: PdfMeta, tiling: Tiling): void {
  drawTitleBlock(page, fonts, meta);
  drawTestSquare(page, SIDE_MM, SQUARE_TOP_MM);
  const captionX = mmToPt(SIDE_MM + TEST_SQUARE_MM + SIDE_MM);
  const captionY = fromTop(SQUARE_TOP_MM + TEST_SQUARE_MM / 2);
  drawTurnedLabel(page, fonts, PDF_STRINGS.ar.measure, {
    x: captionX,
    y: captionY,
    sizePt: CAPTION_PT,
    bold: true,
    align: "left",
  });
  drawTurnedLabel(page, fonts, PDF_STRINGS.en.measure, {
    x: captionX,
    y: captionY - mmToPt(LINE_MM),
    sizePt: CAPTION_PT,
    bold: true,
    align: "left",
  });
  drawPageMap(page, fonts, tiling);
  const printX = A4_PT.width / 2;
  drawTurnedLabel(page, fonts, PDF_STRINGS.ar.printActual, {
    x: printX,
    y: fromTop(PRINT_LINE_MM),
    sizePt: DETAIL_PT,
    align: "center",
  });
  drawTurnedLabel(page, fonts, PDF_STRINGS.en.printActual, {
    x: printX,
    y: fromTop(PRINT_LINE_MM + LINE_MM),
    sizePt: DETAIL_PT,
    align: "center",
  });
}
