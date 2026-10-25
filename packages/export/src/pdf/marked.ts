/** Marked-content wrapper: names a block of drawing so tests (and PDF tools) can find it in the stream. */
import { beginMarkedContent, endMarkedContent, type PDFPage } from "pdf-lib";

/** Prefix of the block that holds a tile page's label. */
export const TILE_TAG_PREFIX = "Tile_";
/** Prefix of a printed tile on the cover's page map. */
export const MAP_TAG_PREFIX = "MapTile_";
/** Prefix of an empty (crossed-out) tile on the cover's page map. */
export const MAP_EMPTY_TAG_PREFIX = "MapEmpty_";

/**
 * Runs drawing inside a marked-content block.
 *
 * @param page - The page.
 * @param tag - The block name (a PDF name: letters, digits, underscore).
 * @param draw - The drawing to wrap.
 */
export function withTag(page: PDFPage, tag: string, draw: () => void): void {
  page.pushOperators(beginMarkedContent(tag));
  draw();
  page.pushOperators(endMarkedContent());
}
