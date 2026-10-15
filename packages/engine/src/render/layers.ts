/** One small function per SVG layer: each returns the inner markup of its `<g>` (decision 127). */
import type { Piece, Point } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import {
  add,
  distance,
  normalize,
  perpendicular,
  pointAtLength,
  scale,
  sub,
  tangentAtLength,
  translate,
} from "../geometry";
import { escapeXml, fmt, fmtPoint, pathData } from "./format";
import { SCALE_SQUARE_MM, type PiecePlacement, type SheetLayout } from "./sheet-layout";

/** Font stack for labels; the first two families must match `--font-sans` in `packages/ui/src/tokens.css` (tested). */
export const SVG_FONT_FAMILY =
  '"IBM Plex Sans Arabic", "Noto Kufi Arabic", "Geeza Pro", "Segoe UI", Tahoma, sans-serif';

/** Line width of the cut line, in mm. */
export const CUT_STROKE_MM = 0.35;
/** Line width of the stitch line, in mm. */
export const STITCH_STROKE_MM = 0.25;
/** Dash and gap of the stitch line, in mm. */
export const STITCH_DASH = "3 1.5";
/** Length of a notch tick across the stitch line, in mm. */
export const NOTCH_LENGTH_MM = 5;
/** Length of a grain-line arrowhead, in mm. */
export const ARROW_LENGTH_MM = 6;
/** Half width of a grain-line arrowhead, in mm. */
export const ARROW_HALF_WIDTH_MM = 2;
/** Text height used when a label gives no size, in mm. */
export const DEFAULT_LABEL_SIZE_MM = 8;
/** Spacing of the minor grid lines, in mm. */
export const GRID_MINOR_MM = 10;
/** Spacing of the major grid lines, in mm. */
export const GRID_MAJOR_MM = 100;
/** Length of a centimetre tick on the scale square, in mm. */
const SCALE_TICK_MM = 3;
/** Text height of the scale square caption, in mm. */
const SCALE_CAPTION_MM = 6;
/** Number of ticks along one side of the scale square (one per centimetre). */
const SCALE_TICKS = SCALE_SQUARE_MM / GRID_MINOR_MM;

/**
 * The piece's points moved onto the sheet.
 *
 * @param p - A point in piece coordinates.
 * @param placement - Where the piece sits.
 * @returns The point on the sheet.
 */
function onSheet(p: Point, placement: PiecePlacement): Point {
  return add(p, placement.offset);
}

/**
 * Grid lines every 10 mm (thin) and 100 mm (strong), behind everything.
 *
 * @param layout - The sheet.
 * @returns Markup of two paths.
 */
export function gridLayer(layout: SheetLayout): string {
  const minor: string[] = [];
  const major: string[] = [];
  for (let x = 0; x <= layout.widthMm; x += GRID_MINOR_MM) {
    (x % GRID_MAJOR_MM === 0 ? major : minor).push(`M ${fmt(x)} 0 V ${fmt(layout.heightMm)}`);
  }
  for (let y = 0; y <= layout.heightMm; y += GRID_MINOR_MM) {
    (y % GRID_MAJOR_MM === 0 ? major : minor).push(`M 0 ${fmt(y)} H ${fmt(layout.widthMm)}`);
  }
  return [
    `<path id="grid-minor" d="${minor.join(" ")}" fill="none" stroke="#d0d0d0" stroke-width="0.1"/>`,
    `<path id="grid-major" d="${major.join(" ")}" fill="none" stroke="#a0a0a0" stroke-width="0.2"/>`,
  ].join("\n");
}

/**
 * The cut line of every piece.
 *
 * @param layout - The sheet.
 * @returns One path per piece.
 */
export function cutLayer(layout: SheetLayout): string {
  return layout.placements
    .map((pl) => {
      const d = pathData(translate(pl.piece.cutPath, pl.offset), true);
      return `<path id="piece-${escapeXml(pl.piece.id)}-cut" d="${d}" fill="none" stroke="#000000" stroke-width="${fmt(CUT_STROKE_MM)}"/>`;
    })
    .join("\n");
}

/**
 * The stitch line of every piece, dashed.
 *
 * @param layout - The sheet.
 * @returns One path per piece.
 */
export function stitchLayer(layout: SheetLayout): string {
  return layout.placements
    .map((pl) => {
      const d = pathData(translate(pl.piece.stitchPath, pl.offset), true);
      return `<path id="piece-${escapeXml(pl.piece.id)}-stitch" d="${d}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}" stroke-dasharray="${STITCH_DASH}"/>`;
    })
    .join("\n");
}

/**
 * One notch as a short tick across the stitch line.
 *
 * @param piece - The piece the notch belongs to.
 * @param notch - The notch.
 * @returns The tick start and end in piece coordinates.
 * @throws {DraftingError} RENDER_EDGE_NOT_FOUND when the notch names an unknown edge.
 */
function notchTick(piece: Piece, notch: Piece["notches"][number]): [Point, Point] {
  const edge = piece.edges.find((e) => e.id === notch.edgeId);
  if (!edge) {
    throw new DraftingError("RENDER_EDGE_NOT_FOUND", `Notch ${notch.id} names unknown edge ${notch.edgeId}`);
  }
  const edgePath = piece.stitchPath.slice(edge.fromSegment, edge.toSegment + 1);
  const at = pointAtLength(edgePath, notch.atMm);
  const half = scale(perpendicular(tangentAtLength(edgePath, notch.atMm)), NOTCH_LENGTH_MM / 2);
  return [sub(at, half), add(at, half)];
}

/**
 * Notch ticks of every piece.
 *
 * @param layout - The sheet.
 * @returns One path per notch.
 */
export function notchesLayer(layout: SheetLayout): string {
  return layout.placements
    .flatMap((pl) =>
      pl.piece.notches.map((notch) => {
        const [a, b] = notchTick(pl.piece, notch).map((p) => onSheet(p, pl));
        return `<path id="piece-${escapeXml(pl.piece.id)}-notch-${escapeXml(notch.id)}" d="M ${fmtPoint(a!)} L ${fmtPoint(b!)}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}"/>`;
      }),
    )
    .join("\n");
}

/**
 * Path data for an arrowhead whose tip is `tip`, pointing along `dir`.
 *
 * @param tip - The tip point.
 * @param dir - Unit direction the arrow points to.
 * @returns Path commands.
 */
function arrowhead(tip: Point, dir: Point): string {
  const back = sub(tip, scale(dir, ARROW_LENGTH_MM));
  const side = scale(perpendicular(dir), ARROW_HALF_WIDTH_MM);
  return `M ${fmtPoint(add(back, side))} L ${fmtPoint(tip)} L ${fmtPoint(sub(back, side))}`;
}

/**
 * Grain line with an arrowhead at both ends.
 *
 * @param from - Start point on the sheet.
 * @param to - End point on the sheet.
 * @returns Path data (just the line when the two points coincide).
 */
function grainData(from: Point, to: Point): string {
  const line = `M ${fmtPoint(from)} L ${fmtPoint(to)}`;
  if (distance(from, to) <= ARROW_LENGTH_MM) return line;
  const dir = normalize(sub(to, from));
  return `${line} ${arrowhead(to, dir)} ${arrowhead(from, scale(dir, -1))}`;
}

/**
 * Grain line of every piece.
 *
 * @param layout - The sheet.
 * @returns One path per piece.
 */
export function grainLayer(layout: SheetLayout): string {
  return layout.placements
    .map((pl) => {
      const [from, to] = pl.piece.grainLine.map((p) => onSheet(p, pl));
      return `<path id="piece-${escapeXml(pl.piece.id)}-grain" d="${grainData(from!, to!)}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}"/>`;
    })
    .join("\n");
}

/**
 * Darts of every piece as leg, apex, leg.
 *
 * @param layout - The sheet.
 * @returns One path per dart.
 */
export function dartsLayer(layout: SheetLayout): string {
  return layout.placements
    .flatMap((pl) =>
      pl.piece.darts.map((dart) => {
        const [l1, l2] = dart.legs.map((p) => onSheet(p, pl));
        const apex = onSheet(dart.apex, pl);
        return `<path id="piece-${escapeXml(pl.piece.id)}-dart-${escapeXml(dart.id)}" d="M ${fmtPoint(l1!)} L ${fmtPoint(apex)} L ${fmtPoint(l2!)}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}"/>`;
      }),
    )
    .join("\n");
}

/**
 * Text element for a label, in Arabic and right to left.
 *
 * @param label - The label.
 * @param at - Where it is drawn, on the sheet.
 * @param id - Element id.
 * @returns The `<text>` markup.
 */
function textElement(label: Piece["labels"][number], at: Point, id: string): string {
  const rotate =
    label.rotationDeg === 0 ? "" : ` transform="rotate(${fmt(label.rotationDeg)} ${fmtPoint(at)})"`;
  return `<text id="${id}" x="${fmt(at.x)}" y="${fmt(at.y)}"${rotate} font-family='${SVG_FONT_FAMILY}' font-size="${fmt(label.sizeMm ?? DEFAULT_LABEL_SIZE_MM)}" direction="rtl" unicode-bidi="plaintext" text-anchor="middle">${escapeXml(label.text.ar)}</text>`;
}

/**
 * Labels the engine put on the pieces (nothing is invented here).
 *
 * @param layout - The sheet.
 * @returns One text per label.
 */
export function labelsLayer(layout: SheetLayout): string {
  return layout.placements
    .flatMap((pl) =>
      pl.piece.labels.map((label) =>
        textElement(
          label,
          onSheet(label.at, pl),
          `piece-${escapeXml(pl.piece.id)}-label-${escapeXml(label.id)}`,
        ),
      ),
    )
    .join("\n");
}

/**
 * Centimetre ticks along the top and left sides of the scale square.
 *
 * @param origin - Top-left of the square.
 * @returns Path data.
 */
function scaleTicks(origin: Point): string {
  const ticks: string[] = [];
  for (let i = 1; i < SCALE_TICKS; i += 1) {
    const d = i * GRID_MINOR_MM;
    ticks.push(`M ${fmt(origin.x + d)} ${fmt(origin.y)} v ${fmt(SCALE_TICK_MM)}`);
    ticks.push(`M ${fmt(origin.x)} ${fmt(origin.y + d)} h ${fmt(SCALE_TICK_MM)}`);
  }
  return ticks.join(" ");
}

/**
 * Caption text of the scale square.
 *
 * @param text - The words.
 * @param id - Element id.
 * @param at - Text anchor point.
 * @param direction - Text direction.
 * @returns The `<text>` markup.
 */
function caption(text: string, id: string, at: Point, direction: "rtl" | "ltr"): string {
  return `<text id="${id}" x="${fmt(at.x)}" y="${fmt(at.y)}" font-family='${SVG_FONT_FAMILY}' font-size="${fmt(SCALE_CAPTION_MM)}" direction="${direction}" unicode-bidi="plaintext" text-anchor="middle">${text}</text>`;
}

/**
 * The 100 x 100 mm scale check square with centimetre ticks and a caption (FR-PAT-02).
 *
 * @param layout - The sheet.
 * @returns Markup of the square, ticks and captions.
 */
export function scaleLayer(layout: SheetLayout): string {
  const o = layout.scaleSquare;
  const centre = { x: o.x + SCALE_SQUARE_MM / 2, y: o.y + SCALE_SQUARE_MM / 2 };
  return [
    `<rect id="scale-square" x="${fmt(o.x)}" y="${fmt(o.y)}" width="${fmt(SCALE_SQUARE_MM)}" height="${fmt(SCALE_SQUARE_MM)}" fill="none" stroke="#000000" stroke-width="${fmt(CUT_STROKE_MM)}"/>`,
    `<path id="scale-ticks" d="${scaleTicks(o)}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}"/>`,
    caption("١٠ سم", "scale-caption-ar", { x: centre.x, y: centre.y - SCALE_CAPTION_MM / 2 }, "rtl"),
    caption("10 cm", "scale-caption-en", { x: centre.x, y: centre.y + SCALE_CAPTION_MM }, "ltr"),
  ].join("\n");
}
