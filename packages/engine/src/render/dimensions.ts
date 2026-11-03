/** The dimension layer: the sewn length of every edge in cm, and a curve marker with its depth (issue #391). */
import type { Piece, Point } from "@tafsila/schemas";
import {
  DIMENSION_CHORD_DASH,
  DIMENSION_CURVE_LABEL_OFFSET_MM,
  DIMENSION_LABEL_OFFSET_MM,
  DIMENSION_MAX_TEXT_ANGLE_DEG,
  DIMENSION_STROKE_MM,
  DIMENSION_TEXT_MM,
  DIMENSION_WORDS,
} from "../constants/dimensions";
import {
  add,
  pathLength,
  perpendicular,
  pointAtLength,
  pointInPolygon,
  samplePath,
  scale,
  tangentAtLength,
} from "../geometry";
import { edgeCurve, type EdgeCurve } from "../pieces/edge-curve";
import { edgeSegments } from "../pieces/measure";
import { escapeXml, fmt, fmtPoint } from "./format";
import { onSheet, SVG_FONT_FAMILY } from "./layers";
import type { PiecePlacement, SheetLayout } from "./sheet-layout";

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;

/** Half a turn in degrees, used to keep text upright. */
const HALF_TURN_DEG = 180;

/**
 * A length in cm with one decimal, as written on the pattern.
 *
 * @param mm - Length in mm.
 * @returns The text, for example `24.5`.
 */
export function formatCm(mm: number): string {
  return (Math.round(mm) / MM_PER_CM).toFixed(1);
}

/**
 * The angle of a direction in degrees, turned by half a turn when needed so text never reads upside down.
 *
 * @param direction - Unit direction along the edge.
 * @returns An angle in (-90, 90].
 */
function uprightAngleDeg(direction: Point): number {
  const deg = (Math.atan2(direction.y, direction.x) * HALF_TURN_DEG) / Math.PI;
  if (deg > DIMENSION_MAX_TEXT_ANGLE_DEG) return deg - HALF_TURN_DEG;
  return deg <= -DIMENSION_MAX_TEXT_ANGLE_DEG ? deg + HALF_TURN_DEG : deg;
}

/**
 * The unit normal of an edge that points into the piece, so labels sit inside and never on the cut line.
 *
 * @param piece - The piece.
 * @param at - A point on the edge.
 * @param direction - Unit direction of the edge there.
 * @returns The normal pointing inside the stitch line.
 */
function inwardNormal(piece: Piece, at: Point, direction: Point): Point {
  const normal = perpendicular(direction);
  const probe = add(at, scale(normal, DIMENSION_LABEL_OFFSET_MM));
  return pointInPolygon(probe, samplePath(piece.stitchPath)) ? normal : scale(normal, -1);
}

/**
 * One text of the layer: centred on `at`, turned along the edge.
 *
 * @param text - The words and numbers.
 * @param at - Where it is drawn, on the sheet.
 * @param angleDeg - Rotation in degrees.
 * @param id - Element id.
 * @returns The `<text>` markup.
 */
function dimensionText(text: string, at: Point, angleDeg: number, id: string): string {
  const rotate =
    Math.abs(angleDeg) < Number.EPSILON ? "" : ` transform="rotate(${fmt(angleDeg)} ${fmtPoint(at)})"`;
  return `<text id="${id}" x="${fmt(at.x)}" y="${fmt(at.y)}"${rotate} font-family='${SVG_FONT_FAMILY}' font-size="${fmt(DIMENSION_TEXT_MM)}" direction="rtl" unicode-bidi="plaintext" text-anchor="middle">${escapeXml(text)}</text>`;
}

/**
 * The words of a curve marker: its arc depth and, for a true circular arc, its radius, both in cm.
 *
 * @param curve - The measured curve.
 * @returns For example `قوس 1.2 · نق 31.0`.
 */
export function curveText(curve: EdgeCurve): string {
  const depth = `${DIMENSION_WORDS.depth} ${formatCm(curve.depthMm)}`;
  return curve.radiusMm === undefined
    ? depth
    : `${depth} · ${DIMENSION_WORDS.radius} ${formatCm(curve.radiusMm)}`;
}

/**
 * The thin lines that show a curve: the chord between its ends (dashed) and the depth line from the chord to
 * the deepest point.
 *
 * @param curve - The measured curve.
 * @param pl - Where the piece sits.
 * @param id - Element id.
 * @returns One path.
 */
function curveMarks(curve: EdgeCurve, pl: PiecePlacement, id: string): string {
  const chord = `M ${fmtPoint(onSheet(curve.from, pl))} L ${fmtPoint(onSheet(curve.to, pl))}`;
  const depth = curve.foot
    ? ` M ${fmtPoint(onSheet(curve.foot, pl))} L ${fmtPoint(onSheet(curve.deepest, pl))}`
    : "";
  return `<path id="${id}" d="${chord}${depth}" fill="none" stroke="#000000" stroke-width="${fmt(DIMENSION_STROKE_MM)}" stroke-dasharray="${DIMENSION_CHORD_DASH}"/>`;
}

/**
 * The markup of one edge: its length, and the curve marker when it is a curve.
 *
 * @param pl - Where the piece sits.
 * @param edge - The edge.
 * @returns One to three elements; none for an edge with no length.
 */
function edgeDimension(pl: PiecePlacement, edge: Piece["edges"][number]): string[] {
  const segments = edgeSegments(pl.piece, edge.id);
  const lengthMm = pathLength(segments);
  if (lengthMm <= 0) return [];
  const id = `piece-${escapeXml(pl.piece.id)}-dim-${escapeXml(edge.id)}`;
  const middle = pointAtLength(segments, lengthMm / 2);
  const direction = tangentAtLength(segments, lengthMm / 2);
  const inward = inwardNormal(pl.piece, middle, direction);
  const angle = uprightAngleDeg(direction);
  const lengthAt = onSheet(add(middle, scale(inward, DIMENSION_LABEL_OFFSET_MM)), pl);
  const elements = [dimensionText(formatCm(lengthMm), lengthAt, angle, id)];
  const curve = edgeCurve(segments);
  if (!curve) return elements;
  const curveAt = onSheet(add(middle, scale(inward, DIMENSION_CURVE_LABEL_OFFSET_MM)), pl);
  return [
    ...elements,
    curveMarks(curve, pl, `piece-${escapeXml(pl.piece.id)}-curve-${escapeXml(edge.id)}`),
    dimensionText(
      curveText(curve),
      curveAt,
      angle,
      `piece-${escapeXml(pl.piece.id)}-curve-${escapeXml(edge.id)}-text`,
    ),
  ];
}

/**
 * Dimensions of every piece: each stitch edge gets its length in cm along the edge, inside the piece; each
 * curved edge also gets a dashed chord, a depth line and its depth (and radius for a true arc). Straight edges
 * carry the length only.
 *
 * @param layout - The sheet.
 * @returns One text per edge, plus the curve marks.
 */
export function dimensionsLayer(layout: SheetLayout): string {
  return layout.placements
    .flatMap((pl) => pl.piece.edges.flatMap((edge) => edgeDimension(pl, edge)))
    .join("\n");
}
