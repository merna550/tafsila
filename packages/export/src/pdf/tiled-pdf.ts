/** The generic tiled PDF builder: A4 and A0 differ only by paper and cover (decision 288). */
import { PDFDocument } from "pdf-lib";
import { layoutSheet, type PatternScene } from "@tafsila/engine";
import type { PatternResult, Point } from "@tafsila/schemas";
import { PAPERS, type PaperId } from "../tiles/paper";
import { tileInput } from "../tiles/tile-input";
import { tileSheet } from "../tiles/tile-sheet";
import type { Tile, Tiling } from "../tiles/types";
import { A0_HEADER_MM, drawA0Header, withHeaderBand } from "./a0-header";
import { drawCover } from "./draw-cover";
import { drawTileLabelAndFooter, drawTileMarks } from "./draw-marks";
import { drawPiecesInWindow } from "./draw-pieces";
import { embedFonts } from "./fonts";
import type { PageContext, PageFrame, PdfBuildOptions, PdfMeta, PdfOutput } from "./types";
import { mmToPt } from "./units";

/**
 * The page size in points for a tiling (landscape swaps the sides).
 *
 * @param tiling - The tiling.
 * @returns Width and height in points.
 */
function pageSizePt(tiling: Tiling): { width: number; height: number } {
  const p = PAPERS[tiling.paper];
  const [w, h] = tiling.orientation === "portrait" ? [p.widthMm, p.heightMm] : [p.heightMm, p.widthMm];
  return { width: mmToPt(w), height: mmToPt(h) };
}

/**
 * The printable rectangle of a page.
 *
 * @param tiling - The tiling.
 * @param size - Page size in points.
 * @returns The frame.
 */
function frameOf(tiling: Tiling, size: { width: number; height: number }): PageFrame {
  const margin = mmToPt(PAPERS[tiling.paper].marginMm);
  return {
    leftPt: margin,
    topPt: size.height - margin,
    widthPt: mmToPt(tiling.printableMm.widthMm),
    heightPt: mmToPt(tiling.printableMm.heightMm),
  };
}

/** What the PDF draws: the pattern, its scene and the title block. */
export interface PdfSource {
  /** The pattern; used to lay out the tiles and find the scale square. */
  readonly result: PatternResult;
  /** The viewer scene of the same pattern, in sheet mm. */
  readonly scene: PatternScene;
  /** Title block data and the fixed creation date. */
  readonly meta: PdfMeta;
}

/** How the PDF is laid out. */
export interface PdfLayout {
  /** "A4" or "A0". */
  readonly paper: PaperId;
  /** True to add the cover page (A4). */
  readonly withCover: boolean;
  /** True to reserve the header band on sheet 1 (A0, decision 290): test square, title block and page map. */
  readonly withHeader?: boolean;
}

/**
 * Creates the empty document with its fixed metadata, so the same input gives the same bytes.
 *
 * @param meta - Title block data and the fixed creation date.
 * @returns The document.
 */
async function newDocument(meta: PdfMeta): Promise<PDFDocument> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  const date = new Date(meta.createdAt);
  doc.setCreationDate(date);
  doc.setModificationDate(date);
  doc.setProducer("Tafsila");
  doc.setCreator("Tafsila");
  doc.setTitle(meta.title);
  return doc;
}

/** What one tile page needs besides its tile. */
interface TilePageInput {
  readonly source: PdfSource;
  readonly layout: PdfLayout;
  readonly tiling: Tiling;
  readonly ctx: PageContext;
  /** Pages in the file. */
  readonly pages: number;
  /** One-based number of this page. */
  readonly pageNo: number;
  /** Top-left of the sheet's scale square. */
  readonly scaleSquare: Point | undefined;
}

/**
 * Draws one tile page: marks, the A0 header on the first tile, the pieces and the label and footer.
 *
 * @param tile - The tile.
 * @param input - Source, layout, tiling and page context.
 */
function drawTilePage(tile: Tile, input: TilePageInput): void {
  const { source, layout, tiling, ctx } = input;
  const { meta, scene } = source;
  drawTileMarks(ctx, tile.marks, tiling.overlapMm);
  const bandMm = layout.withHeader ? A0_HEADER_MM : 0;
  if (layout.withHeader && tile.row === 0 && tile.col === 0) drawA0Header(ctx, meta, tiling);
  const w = tile.window;
  drawPiecesInWindow(
    { ...ctx, window: { ...w, minY: w.minY - bandMm, maxY: w.maxY - bandMm } },
    scene,
    input.scaleSquare,
  );
  const single = layout.withHeader && tiling.printed.length === 1;
  drawTileLabelAndFooter(ctx, single ? null : tile.label, {
    title: meta.title,
    versionNo: meta.versionNo,
    engineVersion: meta.engineVersion,
    page: input.pageNo,
    pages: input.pages,
  });
}

/**
 * Builds a tiled PDF: an optional cover, then one page per non-empty tile, at true scale.
 * Pure: the same input gives the same bytes (dates come from `meta.createdAt`, no object streams).
 *
 * @param source - Pattern, scene and title block data.
 * @param layout - Paper, cover and header.
 * @param options - Fonts and progress callback.
 * @returns The bytes and page counts.
 */
export async function buildTiledPdf(
  source: PdfSource,
  layout: PdfLayout,
  options: PdfBuildOptions,
): Promise<PdfOutput> {
  const { result, meta } = source;
  const base = tileInput(result);
  const tiling = tileSheet(layout.withHeader ? withHeaderBand(base) : base, layout.paper);
  const printed = tiling.tiles.filter((t) => !t.empty);
  const pages = printed.length + (layout.withCover ? 1 : 0);
  const doc = await newDocument(meta);
  const fonts = await embedFonts(doc, options.fonts);
  const size = pageSizePt(tiling);
  const frame = frameOf(tiling, size);
  const scaleSquare = layoutSheet(result.pieces).scaleSquare ?? undefined;
  let done = 0;
  if (layout.withCover) {
    drawCover(doc.addPage([size.width, size.height]), fonts, meta, tiling);
    options.onProgress?.(++done, pages);
  }
  for (const tile of printed) {
    const ctx = { page: doc.addPage([size.width, size.height]), fonts, frame, window: tile.window };
    drawTilePage(tile, { source, layout, tiling, ctx, pages, pageNo: done + 1, scaleSquare });
    options.onProgress?.(++done, pages);
  }
  const bytes = await doc.save({ useObjectStreams: false });
  return { bytes, pageCount: pages, tileCount: printed.length };
}
