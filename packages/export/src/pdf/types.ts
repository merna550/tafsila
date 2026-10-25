/** Public types of the PDF builder (decision 288). */
import type { PDFPage } from "pdf-lib";
import type { Rect } from "@tafsila/engine";
import type { EmbeddedFonts, PdfFonts } from "./fonts";

/** What the PDF says about the pattern; no dates other than the version's own `created_at`. */
export interface PdfMeta {
  /** Design title shown on the cover and in the footer. */
  readonly title: string;
  /** Version number of the design. */
  readonly versionNo: number;
  /** Client name, or an empty string when the pattern has no client. */
  readonly clientLabel: string;
  /** Version of the pattern engine that drew the geometry. */
  readonly engineVersion: string;
  /** ISO time the version was created; becomes the fixed `CreationDate` of the file. */
  readonly createdAt: string;
}

/** Called after the cover and after each tile page. */
export type PdfProgress = (done: number, total: number) => void;

/** Everything the builder needs from outside: the package does no I/O (decision 288). */
export interface PdfBuildOptions {
  /** Font bytes, fetched by the caller. */
  readonly fonts: PdfFonts;
  /** Optional progress callback; the web worker forwards it. */
  readonly onProgress?: PdfProgress;
}

/** The finished file. */
export interface PdfOutput {
  /** The PDF file bytes. */
  readonly bytes: Uint8Array;
  /** Pages in the file, including the cover. */
  readonly pageCount: number;
  /** Tile pages (non-empty tiles), without the cover. */
  readonly tileCount: number;
}

/** The printable rectangle of a page, in PDF points (origin bottom-left). */
export interface PageFrame {
  /** Left edge of the printable rectangle. */
  readonly leftPt: number;
  /** Top edge of the printable rectangle (a y value near the top of the page). */
  readonly topPt: number;
  /** Printable width. */
  readonly widthPt: number;
  /** Printable height. */
  readonly heightPt: number;
}

/** What every drawing function of a tile page needs: the page, its fonts, its printable rectangle and the sheet window it shows. */
export interface PageContext {
  /** The page being drawn. */
  readonly page: PDFPage;
  /** Embedded fonts. */
  readonly fonts: EmbeddedFonts;
  /** Printable rectangle of the page. */
  readonly frame: PageFrame;
  /** The part of the sheet this page shows, in sheet mm. */
  readonly window: Rect;
}
