/**
 * Arabic and mixed-direction labels in a PDF (decision 282).
 *
 * Route (b) of the spike plan: fontkit joins Arabic letters correctly and lays an all-Arabic string out in visual order,
 * but it treats a mixed string as ONE right-to-left run, so Latin names and digit groups come out reversed
 * ("Nour" -> "ruoN"). We therefore split the label into direction runs, order the runs visually, and let fontkit lay out
 * each run on its own.
 */
import type { PDFPage } from "pdf-lib";
import type { EmbeddedFonts } from "./fonts";

/** How a character takes part in the run ordering. */
type CharKind = "ar" | "an" | "lt" | "neutral";

/** Where the label sits relative to its anchor x: `start` follows the reading direction, `end` is the opposite side. */
export type LabelAlign = "start" | "end" | "center";

/** Options of {@link drawLabel}. */
export interface LabelOptions {
  /** Anchor x in points. */
  readonly x: number;
  /** Baseline y in points (PDF origin is bottom-left). */
  readonly y: number;
  /** Font size in points. */
  readonly sizePt: number;
  /** Use the bold weight. */
  readonly bold?: boolean;
  /** Alignment against the anchor; `start` of a right-to-left label is its right edge. */
  readonly align: LabelAlign;
  /** True for an Arabic (right-to-left) label; sets the base direction. */
  readonly rtl: boolean;
}

const ARABIC_SCRIPT = /\p{scx=Arabic}/u;
const DIGIT = /\p{Nd}/u;
const LATIN_OR_DIGIT = /[\p{L}\p{N}]/u;

/**
 * Classifies one character: Arabic letter, Arabic-Indic digit, other letter or digit, or neutral (space, dash...).
 *
 * @param ch - One character.
 * @returns The kind of the character.
 */
function kindOf(ch: string): CharKind {
  if (!ARABIC_SCRIPT.test(ch)) return LATIN_OR_DIGIT.test(ch) ? "lt" : "neutral";
  return DIGIT.test(ch) ? "an" : "ar";
}

/** A stretch of text of one kind. */
interface Run {
  kind: Exclude<CharKind, "neutral">;
  text: string;
}

/**
 * Splits a label into runs; a neutral stretch joins its neighbours only when both sides are the same kind.
 *
 * @param text - The label text.
 * @param base - Base direction kind.
 * @returns The runs in logical order.
 */
function splitRuns(text: string, base: Run["kind"]): Run[] {
  const groups: { kind: CharKind; text: string }[] = [];
  for (const ch of text) {
    const kind = kindOf(ch);
    const last = groups.at(-1);
    if (last && last.kind === kind) last.text += ch;
    else groups.push({ kind, text: ch });
  }
  const runs: Run[] = [];
  groups.forEach((g, i) => {
    if (g.kind !== "neutral") {
      runs.push({ kind: g.kind, text: g.text });
      return;
    }
    const prev = groups[i - 1]?.kind;
    const next = groups[i + 1]?.kind;
    if (prev && prev === next && prev !== "an") runs[runs.length - 1]!.text += g.text;
    else runs.push({ kind: base, text: g.text });
  });
  return mergeSameKind(runs);
}

/**
 * Joins neighbouring runs of one kind (a neutral run in the base direction next to its own kind).
 *
 * @param runs - Runs in logical order.
 * @returns The merged runs.
 */
function mergeSameKind(runs: Run[]): Run[] {
  return runs.reduce<Run[]>((out, run) => {
    const last = out.at(-1);
    if (last && last.kind === run.kind) last.text += run.text;
    else out.push({ ...run });
    return out;
  }, []);
}

/**
 * Returns the strings to draw from left to right, one per run, ready for pdf-lib/fontkit.
 * A right-to-left label lists its runs in reverse (first logical run is rightmost). Arabic-Indic digit groups are written
 * reversed because fontkit reverses every Arabic-script run, which would otherwise show "٢١" for "١٢".
 *
 * @param text - The label text.
 * @param rtl - True for a right-to-left label.
 * @returns Strings to draw from left to right.
 */
export function shapeForPdf(text: string, rtl: boolean): string[] {
  const runs = splitRuns(text, rtl ? "ar" : "lt");
  const visual = rtl ? runs.toReversed() : runs;
  return visual.map((r) => (r.kind === "an" ? [...r.text].reverse().join("") : r.text));
}

/**
 * Draws a label with the embedded Plex Arabic font and returns its width in points.
 *
 * @param page - The page to draw on.
 * @param fonts - The embedded or injected fonts.
 * @param text - The label text.
 * @param options - Label options.
 * @returns The label width in points.
 */
export function drawLabel(page: PDFPage, fonts: EmbeddedFonts, text: string, options: LabelOptions): number {
  const font = options.bold ? fonts.bold : fonts.regular;
  const runs = shapeForPdf(text, options.rtl);
  const widths = runs.map((r) => font.widthOfTextAtSize(r, options.sizePt));
  const total = widths.reduce((a, b) => a + b, 0);
  let x = leftEdge(options, total);
  runs.forEach((run, i) => {
    page.drawText(run, { x, y: options.y, size: options.sizePt, font });
    x += widths[i]!;
  });
  return total;
}

/**
 * The x of the left edge of a label of the given width.
 *
 * @param root0 - Label options (anchor and alignment).
 * @param width - Label width in points.
 * @returns The x of the left edge in points.
 */
function leftEdge({ x, align, rtl }: LabelOptions, width: number): number {
  if (align === "center") return x - width / 2;
  const atLeft = (align === "start") !== rtl;
  return atLeft ? x : x - width;
}
