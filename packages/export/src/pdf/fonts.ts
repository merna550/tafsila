/** Font embedding for the PDF code (decision 282): callers inject the font bytes, the package imports no font file. */
import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument, PDFFont } from "pdf-lib";

/** The font bytes a caller fetches (the web worker loads `/fonts/IBMPlexSansArabic-*.ttf` on demand). */
export interface PdfFonts {
  readonly regular: Uint8Array;
  readonly bold: Uint8Array;
}

/** The two fonts after embedding in one document. */
export interface EmbeddedFonts {
  readonly regular: PDFFont;
  readonly bold: PDFFont;
}

/** Fixed PostScript base name: pdf-lib adds a random suffix otherwise, which breaks byte-identical rebuilds. */
const FONT_NAME = "TafsilaPlexArabic";

/**
 * Registers fontkit on the document and embeds both weights as subsets (only the used glyphs are stored).
 *
 * @param doc - The document.
 * @param fonts - The embedded or injected fonts.
 * @returns The embedded fonts.
 */
export async function embedFonts(doc: PDFDocument, fonts: PdfFonts): Promise<EmbeddedFonts> {
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(fonts.regular, { subset: true, customName: `${FONT_NAME}-Regular` });
  const bold = await doc.embedFont(fonts.bold, { subset: true, customName: `${FONT_NAME}-Bold` });
  return { regular, bold };
}
