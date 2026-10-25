/** The one-page sample PDF of spike #282: real piece outline, a 100 mm test square and Arabic and mixed labels. */
import {
  PDFDocument,
  beginMarkedContent,
  endMarkedContent,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  stroke,
} from "pdf-lib";
import type { Point } from "@tafsila/schemas";
import { drawLabel } from "./arabic-text";
import { embedFonts, type PdfFonts } from "./fonts";
import { A0_PT, MM_TO_PT, mmToPt } from "./units";

/** Decimals of an SVG path coordinate (mm). */
const PATH_DECIMALS = 3;
/** Gap above the test square to the first label, in mm. */
const LABEL_GAP_MM = 20;
/** Distance between label baselines, in mm. */
const LABEL_STEP_MM = 14;
/** Label font size in points. */
const LABEL_SIZE_PT = 24;
/** Page margin in mm. */
const MARGIN_MM = 20;
/** Side of the test square in mm. */
export const TEST_SQUARE_MM = 100;
/** Fixed date so the same input gives the same bytes (#288 relies on it). */
const FIXED_DATE = new Date("2026-01-01T00:00:00Z");

/** Labels drawn by the spike: Arabic, Arabic with digits, Arabic with a Latin name, Latin, bold. */
export const SPIKE_LABELS = ["أمام - قص ٢", "فستان - Nour", "كم ١٢ سم", "Front - cut 2", "تفصيلة"] as const;

/**
 * Builds an SVG path string for a closed outline, relative to the outline's top-left corner.
 *
 * @param outline - Closed outline in mm.
 * @returns The SVG path string.
 */
export function outlinePath(outline: readonly Point[]): string {
  const minX = Math.min(...outline.map((p) => p.x));
  const minY = Math.min(...outline.map((p) => p.y));
  const pts = outline.map(
    (p) => `${(p.x - minX).toFixed(PATH_DECIMALS)} ${(p.y - minY).toFixed(PATH_DECIMALS)}`,
  );
  return `M ${pts.join(" L ")} Z`;
}

/**
 * Wraps drawing in marked content so tests can read it back from the content stream.
 *
 * @param page - The page to draw on.
 * @param tag - Marked-content tag name.
 * @param draw - Drawing to wrap.
 */
function marked(page: ReturnType<PDFDocument["addPage"]>, tag: string, draw: () => void): void {
  page.pushOperators(beginMarkedContent(tag));
  draw();
  page.pushOperators(endMarkedContent());
}

/**
 * Builds the sample: an A0 page (the engine outline is drawn 1:1) with the tagged outline, square and labels.
 *
 * @param fonts - The embedded or injected fonts.
 * @param outline - Closed outline in mm.
 * @returns The PDF file bytes.
 */
export async function buildSpikePdf(fonts: PdfFonts, outline: readonly Point[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.setCreationDate(FIXED_DATE);
  doc.setModificationDate(FIXED_DATE);
  doc.setProducer("Tafsila");
  doc.setCreator("Tafsila");
  const embedded = await embedFonts(doc, fonts);
  const page = doc.addPage([A0_PT.width, A0_PT.height]);
  const left = mmToPt(MARGIN_MM);
  const top = A0_PT.height - mmToPt(MARGIN_MM);

  marked(page, "Outline", () =>
    page.drawSvgPath(outlinePath(outline), { x: left, y: top, scale: MM_TO_PT, borderWidth: 1 }),
  );
  const side = mmToPt(TEST_SQUARE_MM);
  marked(page, "TestSquare", () =>
    page.pushOperators(
      pushGraphicsState(),
      rectangle(left, mmToPt(MARGIN_MM), side, side),
      stroke(),
      popGraphicsState(),
    ),
  );
  SPIKE_LABELS.forEach((text, i) => {
    const rtl = /[؀-ۿ]/.test(text);
    const y = mmToPt(MARGIN_MM + TEST_SQUARE_MM + LABEL_GAP_MM + i * LABEL_STEP_MM);
    drawLabel(page, embedded, text, {
      x: rtl ? left + side : left,
      y,
      sizePt: LABEL_SIZE_PT,
      bold: i === SPIKE_LABELS.length - 1,
      align: "start",
      rtl,
    });
  });
  return doc.save();
}
