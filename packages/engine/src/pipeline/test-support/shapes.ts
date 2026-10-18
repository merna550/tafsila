/** Test-only builders for pieces with simple outlines (rectangle, L-shape, trapezoid). */
import type { Piece, Point } from "@tafsila/schemas";
import { defaultGrainLine } from "../../finishing/grain";
import { lineSeg } from "../../geometry";
import type { PieceDraft } from "../draft-context";

/** Share of the bottom width by which the top of the trapezoid is inset on each side. */
const QUARTER = 0.25;

/**
 * A closed straight-line path through the points.
 *
 * @param points - Corners in order (at least three).
 * @returns The closed path.
 */
export function polygonPath(points: readonly Point[]): Piece["stitchPath"] {
  return points.map((p, i) => lineSeg(p, points[(i + 1) % points.length]!));
}

/**
 * A finished-enough piece with the given outline, one edge per side and a default grain line.
 *
 * @param id - Piece id.
 * @param points - Corners in order.
 * @returns A piece draft whose cut path equals its stitch path.
 */
export function polygonPiece(id: string, points: readonly Point[]): PieceDraft {
  const path = polygonPath(points);
  return {
    id,
    name: { ar: "قطعة", en: "Piece" },
    cut: { quantity: 2, onFold: false, mirror: false, fabric: "main" },
    stitchPath: path,
    cutPath: path,
    edges: path.map((_, i) => ({ id: `e${i}`, fromSegment: i, toSegment: i, seamAllowanceMm: 0 })),
    notches: [],
    grainLine: defaultGrainLine(path),
    darts: [],
    bodyLines: [],
  };
}

/**
 * Corners of a w x h rectangle at the origin.
 *
 * @param w - Width in mm.
 * @param h - Height in mm.
 * @returns Four points.
 */
export function rectanglePoints(w: number, h: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}

/**
 * Corners of an L shape: a w x h rectangle with the top-right quarter cut away.
 *
 * @param w - Width in mm.
 * @param h - Height in mm.
 * @returns Six points.
 */
export function lShapePoints(w: number, h: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: w / 2, y: 0 },
    { x: w / 2, y: h / 2 },
    { x: w, y: h / 2 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}

/**
 * Corners of a trapezoid whose top is half as wide as its bottom.
 *
 * @param w - Bottom width in mm.
 * @param h - Height in mm.
 * @returns Four points.
 */
export function trapezoidPoints(w: number, h: number): Point[] {
  return [
    { x: w * QUARTER, y: 0 },
    { x: w * (1 - QUARTER), y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}
