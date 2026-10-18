/** What a label or the scale square must keep clear of, and the box a label occupies (issue #131, decision 131). */
import type { Label, Point } from "@tafsila/schemas";
import { LABEL_CHAR_WIDTH_RATIO, LABEL_DESCENT_RATIO, LABEL_SIZE_MM } from "../constants/labels";
import { distanceSegmentToRect, pointInPolygon, rectCorners, samplePath, type Rect } from "../geometry";
import type { PieceDraft } from "../pipeline/draft-context";

/** A straight stretch of a line a label must stay away from. */
export type Stretch = readonly [Point, Point];

/** A piece reduced to what placement needs. */
export interface PieceObstacles {
  /** The stitch outline as points (the area text may use). */
  readonly outline: readonly Point[];
  /** Every stitch, cut, grain and dart stretch. */
  readonly stretches: readonly Stretch[];
}

/**
 * Splits a polyline into its straight stretches.
 *
 * @param points - Points in order.
 * @returns One stretch per pair of neighbours.
 */
function stretchesOf(points: readonly Point[]): Stretch[] {
  return points.slice(1).map((p, i) => [points[i]!, p] as const);
}

/**
 * The outline and the lines of a piece.
 *
 * @param piece - A piece in progress.
 * @returns Its obstacles.
 */
export function obstaclesOf(piece: PieceDraft): PieceObstacles {
  const outline = samplePath(piece.stitchPath);
  const cut = samplePath(piece.cutPath ?? piece.stitchPath);
  return {
    outline,
    stretches: [
      ...stretchesOf(outline),
      ...stretchesOf(cut),
      [piece.grainLine[0], piece.grainLine[1]],
      ...piece.darts.flatMap((d) => stretchesOf([d.legs[0], d.apex, d.legs[1]])),
    ],
  };
}

/**
 * Estimated width of a text, in mm: characters times text height times a fixed ratio (the engine has no font metrics).
 *
 * @param text - The bilingual text; the longer language counts, so either reads safely.
 * @param sizeMm - Text height.
 * @returns Width in mm.
 */
export function textWidthMm(text: { readonly ar: string; readonly en: string }, sizeMm: number): number {
  return Math.max(text.ar.length, text.en.length) * sizeMm * LABEL_CHAR_WIDTH_RATIO;
}

/**
 * The box a label covers: centred on `at.x`, from one text height above the baseline to the descent below it.
 * A scale square covers its full side, from `at` (its top-left corner).
 *
 * @param label - The label.
 * @returns The box in piece coordinates.
 */
export function labelRect(label: Label): Rect {
  const size = label.sizeMm ?? LABEL_SIZE_MM;
  if (label.kind === "scale-square") {
    return { minX: label.at.x, minY: label.at.y, maxX: label.at.x + size, maxY: label.at.y + size };
  }
  const half = textWidthMm(label.text, size) / 2;
  return {
    minX: label.at.x - half,
    minY: label.at.y - size,
    maxX: label.at.x + half,
    maxY: label.at.y + size * LABEL_DESCENT_RATIO,
  };
}

/**
 * True when a stretch's bounding box lies wholly outside a box, so the stretch cannot touch it.
 *
 * @param box - The box (already grown by any clearance).
 * @param start - One end of the stretch.
 * @param end - The other end.
 * @returns Whether the stretch is certainly outside.
 */
function stretchMissesRect(box: Rect, start: Point, end: Point): boolean {
  return (
    (start.x < box.minX && end.x < box.minX) ||
    (start.x > box.maxX && end.x > box.maxX) ||
    (start.y < box.minY && end.y < box.minY) ||
    (start.y > box.maxY && end.y > box.maxY)
  );
}

/**
 * True when the box is inside the outline and at least `clearanceMm` from every line.
 *
 * @param rect - The box to test.
 * @param obstacles - The piece.
 * @param clearanceMm - Least gap to any line.
 * @returns Whether the box is clear.
 */
export function isClear(rect: Rect, obstacles: PieceObstacles, clearanceMm: number): boolean {
  for (const corner of rectCorners(rect)) {
    if (!pointInPolygon(corner, obstacles.outline)) return false;
  }
  const grown: Rect = {
    minX: rect.minX - clearanceMm,
    minY: rect.minY - clearanceMm,
    maxX: rect.maxX + clearanceMm,
    maxY: rect.maxY + clearanceMm,
  };
  for (const [start, end] of obstacles.stretches) {
    if (stretchMissesRect(grown, start, end)) continue;
    if (distanceSegmentToRect(rect, start, end) < clearanceMm) return false;
  }
  return true;
}

/**
 * True when two boxes are closer than a gap.
 *
 * @param a - First box.
 * @param b - Second box.
 * @param gapMm - Least gap that counts as apart.
 * @returns Whether they overlap once `a` is grown by the gap.
 */
export function rectsTooClose(a: Rect, b: Rect, gapMm: number): boolean {
  return (
    a.minX - gapMm < b.maxX && b.minX < a.maxX + gapMm && a.minY - gapMm < b.maxY && b.minY < a.maxY + gapMm
  );
}
