/** Draws a label that may be turned, on top of `drawLabel` (decision 282). */
import { concatTransformationMatrix, popGraphicsState, pushGraphicsState, type PDFPage } from "pdf-lib";
import { drawLabel, type LabelAlign } from "./arabic-text";
import type { EmbeddedFonts } from "./fonts";

/** Matches any Arabic-script letter. */
const ARABIC = /\p{scx=Arabic}/u;
/** Degrees in a half turn. */
const HALF_TURN_DEG = 180;

/** Where and how a turned label is drawn. */
export interface TurnedLabel {
  /** Anchor x in points. */
  readonly x: number;
  /** Baseline y in points. */
  readonly y: number;
  /** Font size in points. */
  readonly sizePt: number;
  /** Turn in degrees, clockwise as seen on the page (SVG convention). */
  readonly rotationDeg?: number;
  /** Bold weight. */
  readonly bold?: boolean;
  /** Which side of the label sits at the anchor, on the page (not reading order). */
  readonly align: "left" | "right" | "center";
}

/**
 * True when the text contains Arabic, so it is laid out right to left.
 *
 * @param text - Any label.
 * @returns Whether the base direction is right to left.
 */
export function isRtl(text: string): boolean {
  return ARABIC.test(text);
}

/**
 * Turns a page-side alignment into the reading-order alignment `drawLabel` uses.
 *
 * @param align - Which side of the label is at the anchor, on the page.
 * @param rtl - True for a right-to-left label.
 * @returns The reading-order alignment.
 */
function physicalAlign(align: TurnedLabel["align"], rtl: boolean): LabelAlign {
  if (align === "center") return "center";
  return (align === "left") !== rtl ? "start" : "end";
}

/**
 * Draws a label at an anchor, turned about the anchor when `rotationDeg` is not zero.
 *
 * @param page - The page.
 * @param fonts - Embedded fonts.
 * @param text - The label.
 * @param o - Position, size and turn.
 */
export function drawTurnedLabel(page: PDFPage, fonts: EmbeddedFonts, text: string, o: TurnedLabel): void {
  const rtl = isRtl(text);
  const align = physicalAlign(o.align, rtl);
  const deg = o.rotationDeg ?? 0;
  if (deg === 0) {
    drawLabel(page, fonts, text, { ...o, align, rtl });
    return;
  }
  const a = (deg * Math.PI) / HALF_TURN_DEG;
  const [cos, sin] = [Math.cos(a), Math.sin(a)];
  page.pushOperators(pushGraphicsState(), concatTransformationMatrix(cos, -sin, sin, cos, o.x, o.y));
  drawLabel(page, fonts, text, { ...o, align, x: 0, y: 0, rtl });
  page.pushOperators(popGraphicsState());
}
