/** One small function per SVG layer: each returns the inner markup of its `<g>` (decision 127). */
import type { Mark, MarkKind, Piece, Point } from "@tafsila/schemas";
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
/** Distance between the two ticks of a back notch, in mm. */
export const NOTCH_MARK_GAP_MM = 3;
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
 * One notch as short ticks across the stitch line: one for a front notch, two for a back notch (`marks: 2`).
 *
 * @param piece - The piece the notch belongs to.
 * @param notch - The notch.
 * @returns Each tick's start and end in piece coordinates.
 * @throws {DraftingError} RENDER_EDGE_NOT_FOUND when the notch names an unknown edge.
 */
function notchTicks(piece: Piece, notch: Piece["notches"][number]): [Point, Point][] {
  const edge = piece.edges.find((e) => e.id === notch.edgeId);
  if (!edge) {
    throw new DraftingError("RENDER_EDGE_NOT_FOUND", `Notch ${notch.id} names unknown edge ${notch.edgeId}`);
  }
  const edgePath = piece.stitchPath.slice(edge.fromSegment, edge.toSegment + 1);
  const marks = notch.marks ?? 1;
  return Array.from({ length: marks }, (_, i) => {
    const along = notch.atMm + (i - (marks - 1) / 2) * NOTCH_MARK_GAP_MM;
    const at = pointAtLength(edgePath, along);
    const half = scale(perpendicular(tangentAtLength(edgePath, along)), NOTCH_LENGTH_MM / 2);
    return [sub(at, half), add(at, half)];
  });
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
        const d = notchTicks(pl.piece, notch)
          .map(([a, b]) => `M ${fmtPoint(onSheet(a, pl))} L ${fmtPoint(onSheet(b, pl))}`)
          .join(" ");
        return `<path id="piece-${escapeXml(pl.piece.id)}-notch-${escapeXml(notch.id)}" d="${d}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}"/>`;
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
function textElement(
  label: Pick<Piece["labels"][number], "text" | "rotationDeg" | "sizeMm">,
  at: Point,
  id: string,
): string {
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
      pl.piece.labels
        .filter((label) => label.kind !== "scale-square")
        .map((label) =>
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
 * One scale check square with centimetre ticks and a caption.
 *
 * @param o - Top-left of the square on the sheet.
 * @param prefix - Element id prefix.
 * @param text - Caption in both languages.
 * @returns Markup of the square, ticks and captions.
 */
function scaleSquare(o: Point, prefix: string, text: { ar: string; en: string }): string {
  const centre = { x: o.x + SCALE_SQUARE_MM / 2, y: o.y + SCALE_SQUARE_MM / 2 };
  return [
    `<rect id="${prefix}scale-square" x="${fmt(o.x)}" y="${fmt(o.y)}" width="${fmt(SCALE_SQUARE_MM)}" height="${fmt(SCALE_SQUARE_MM)}" fill="none" stroke="#000000" stroke-width="${fmt(CUT_STROKE_MM)}"/>`,
    `<path id="${prefix}scale-ticks" d="${scaleTicks(o)}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}"/>`,
    caption(
      escapeXml(text.ar),
      `${prefix}scale-caption-ar`,
      { x: centre.x, y: centre.y - SCALE_CAPTION_MM / 2 },
      "rtl",
    ),
    caption(
      escapeXml(text.en),
      `${prefix}scale-caption-en`,
      { x: centre.x, y: centre.y + SCALE_CAPTION_MM },
      "ltr",
    ),
  ].join("\n");
}

/**
 * The 100 x 100 mm scale check square (FR-PAT-02): the one a piece carries as a `scale-square` label, else the
 * sheet's own below the pieces. Never both, so a print shows one square.
 *
 * @param layout - The sheet.
 * @returns Markup of the square, ticks and captions.
 */
export function scaleLayer(layout: SheetLayout): string {
  const onPieces = layout.placements.flatMap((pl) =>
    pl.piece.labels
      .filter((label) => label.kind === "scale-square")
      .map((label) => scaleSquare(onSheet(label.at, pl), `piece-${escapeXml(pl.piece.id)}-`, label.text)),
  );
  const own = layout.scaleSquare ? [scaleSquare(layout.scaleSquare, "", { ar: "١٠ سم", en: "10 cm" })] : [];
  return [...onPieces, ...own].join("\n");
}

/**
 * Dash pattern of each mark kind: fold lines, arrows and slits solid, placement lines dashed, gathers dotted (a sleeve
 * end and a button are points, drawn as dots; a buttonhole is a solid line).
 */
export const MARK_DASH: Readonly<Record<MarkKind, string>> = {
  "pleat-fold": "",
  "pleat-placement": "6 2",
  "pleat-direction": "",
  gather: "1 1.5",
  slit: "",
  "sleeve-end": "",
  button: "",
  buttonhole: "",
};

/** Radius of a point mark, in mm. */
export const MARK_POINT_RADIUS_MM = 1.5;

/** How far a gather line is drawn inside its edge so it does not hide the stitch line, in mm. */
export const GATHER_MARK_INSET_MM = 6;

/** Text height of a mark's words, in mm. */
export const MARK_TEXT_SIZE_MM = 5;

/**
 * Path data of one line or arrow mark, in piece coordinates (gathers are moved inside the piece).
 *
 * @param mark - A line or arrow mark.
 * @param pl - Where its piece sits.
 * @returns Path commands; arrows get a head at their tip.
 */
function markLineData(mark: Extract<Mark, { shape: "line" | "arrow" }>, pl: PiecePlacement): string {
  const inset = mark.kind === "gather" ? { x: 0, y: GATHER_MARK_INSET_MM } : { x: 0, y: 0 };
  const from = onSheet(add(mark.from, inset), pl);
  const to = onSheet(add(mark.to, inset), pl);
  const line = `M ${fmtPoint(from)} L ${fmtPoint(to)}`;
  if (mark.shape === "line" || distance(from, to) <= ARROW_LENGTH_MM) return line;
  return `${line} ${arrowhead(to, normalize(sub(to, from)))}`;
}

/**
 * One mark as an SVG element: a circle for a point, a path for a line or an arrow.
 *
 * @param mark - The mark.
 * @param pl - Where its piece sits.
 * @param id - Element id.
 * @returns The markup.
 */
function markElement(mark: Mark, pl: PiecePlacement, id: string): string {
  if (mark.shape === "point") {
    const at = onSheet(mark.at, pl);
    return `<circle id="${id}" cx="${fmt(at.x)}" cy="${fmt(at.y)}" r="${fmt(MARK_POINT_RADIUS_MM)}" fill="#000000"/>`;
  }
  const dash = MARK_DASH[mark.kind];
  const dashAttr = dash === "" ? "" : ` stroke-dasharray="${dash}"`;
  return `<path id="${id}" d="${markLineData(mark, pl)}" fill="none" stroke="#000000" stroke-width="${fmt(STITCH_STROKE_MM)}"${dashAttr}/>`;
}

/**
 * Where a mark's words go: the middle of a line or arrow, just below it; a point's own position.
 *
 * @param mark - The mark.
 * @returns Anchor in piece coordinates.
 */
function markTextAnchor(mark: Mark): Point {
  if (mark.shape === "point") return mark.at;
  const mid = scale(add(mark.from, mark.to), 1 / 2);
  const drop = mark.kind === "gather" ? GATHER_MARK_INSET_MM : 0;
  return add(mid, { x: 0, y: drop + MARK_TEXT_SIZE_MM * 2 });
}

/**
 * Construction marks of every piece (pleat lines, fold arrows, gathers), with their Arabic words (decision 137).
 *
 * @param layout - The sheet.
 * @returns One element per mark, plus one text per mark that has words.
 */
export function marksLayer(layout: SheetLayout): string {
  return layout.placements
    .flatMap((pl) =>
      (pl.piece.marks ?? []).flatMap((mark) => {
        const id = `piece-${escapeXml(pl.piece.id)}-mark-${escapeXml(mark.id)}`;
        const shape = markElement(mark, pl, id);
        if (!mark.text) return [shape];
        const label = { text: mark.text, rotationDeg: 0, sizeMm: MARK_TEXT_SIZE_MM };
        return [shape, textElement(label, onSheet(markTextAnchor(mark), pl), `${id}-text`)];
      }),
    )
    .join("\n");
}
