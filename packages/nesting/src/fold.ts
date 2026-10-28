/**
 * Fold pieces: put the fold edge on y = 0, clip what crosses it (ADR-313 item 5), and unfold a half into the whole
 * shape for an open layout (ADR-312 item 4).
 */
import { type Point, pt } from "@tafsila/engine/geometry";
import type { Piece } from "@tafsila/schemas";
import { FOLD_EPSILON_MM } from "./constants";
import type { PointMap } from "./grain";

/**
 * Where the fold line lies across the fabric after the turn to the selvedge: the mean y of the piece's `fold` edges
 * (the fold runs along the grain). A fold piece without a fold edge uses the smallest x of its cut line on the sheet,
 * where the engine draws centre lines (decision 315).
 *
 * @param piece - A piece cut on the fold.
 * @param turn - The map to the selvedge frame.
 * @param outline - The piece's outline, already in the selvedge frame.
 * @returns The fold line's y in the selvedge frame.
 */
export function foldLineY(piece: Piece, turn: PointMap, outline: readonly Point[]): number {
  const ends = piece.edges
    .filter((e) => e.kind === "fold")
    .flatMap((e) => [piece.stitchPath[e.fromSegment]?.from, piece.stitchPath[e.toSegment]?.to])
    .filter((p): p is Point => p !== undefined)
    .map(turn);
  if (ends.length > 0) return ends.reduce((sum, p) => sum + p.y, 0) / ends.length;
  const sheetMinX = Math.min(...piece.cutPath.map((s) => s.from.x));
  const onSheetFold = piece.cutPath.map((s) => s.from).filter((p) => p.x <= sheetMinX + FOLD_EPSILON_MM);
  return onSheetFold.length > 0 ? turn(onSheetFold[0]!).y : Math.min(...outline.map((p) => p.y));
}

/**
 * The map that puts the fold line on y = 0 with the body of the piece on the positive side.
 *
 * @param outline - Outline in the selvedge frame.
 * @param foldY - The fold line's y in that frame.
 * @returns A translation, with a flip across the fold when the body lies below it.
 */
export function toFoldFrame(outline: readonly Point[], foldY: number): PointMap {
  const above = Math.max(...outline.map((p) => p.y)) - foldY;
  const below = foldY - Math.min(...outline.map((p) => p.y));
  return above >= below ? (p) => pt(p.x, p.y - foldY) : (p) => pt(p.x, foldY - p.y);
}

/**
 * Point where an edge crosses y = 0.
 *
 * @param a - Edge start.
 * @param b - Edge end, on the other side of the fold.
 * @returns The crossing point.
 */
function crossingAtFold(a: Point, b: Point): Point {
  const t = a.y / (a.y - b.y);
  return pt(a.x + t * (b.x - a.x), 0);
}

/**
 * Cuts a polygon back to the fold (Sutherland-Hodgman against y ≥ 0): a cut line that crosses the fold, such as the
 * V-neck facing at the neck corner (ADR-313 item 5) or the outward offset, ends on the fold.
 *
 * @param polygon - Corners in the fold frame.
 * @returns The corners on or above the fold.
 */
export function clipAtFold(polygon: readonly Point[]): Point[] {
  const kept: Point[] = [];
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    if (a.y >= 0) kept.push(a);
    if (a.y >= 0 !== b.y >= 0 && a.y !== b.y) kept.push(crossingAtFold(a, b));
  });
  return kept.map((p) => (Math.abs(p.y) <= FOLD_EPSILON_MM ? pt(p.x, 0) : p));
}

/**
 * How far a run of fold corners reaches along the fold.
 *
 * @param half - Corners of a half shape.
 * @param run - The run as [first index, length].
 * @returns Distance along x between its first and last corner, in mm.
 */
function runSpanMm(half: readonly Point[], run: readonly [number, number]): number {
  const [first, length] = run;
  return Math.abs(half[(first + length - 1) % half.length]!.x - half[first]!.x);
}

/**
 * Index ranges of the cyclic runs of corners lying on the fold.
 *
 * @param half - Corners of a half shape.
 * @returns Each run as [first index, length], the longest along x first.
 */
function foldRuns(half: readonly Point[]): Array<readonly [number, number]> {
  const onFold = half.map((p) => p.y <= FOLD_EPSILON_MM);
  const start = onFold.findIndex((on) => !on);
  const runs: Array<readonly [number, number]> = [];
  for (let k = 1; k <= half.length; k += 1) {
    const i = (start + k) % half.length;
    if (!onFold[i]) continue;
    const prev = runs.at(-1);
    const prevEnd = prev ? (prev[0] + prev[1]) % half.length : -1;
    if (prev && prevEnd === i) runs[runs.length - 1] = [prev[0], prev[1] + 1];
    else runs.push([i, 1]);
  }
  return runs.sort((a, b) => runSpanMm(half, b) - runSpanMm(half, a));
}

/**
 * Unfolds a half shape into the whole piece: the half, then its mirror image across the fold, joined along the fold
 * run (ADR-312 item 4, open layout).
 *
 * @param half - Corners of a half shape in the fold frame (all y ≥ 0, the fold run on y = 0).
 * @returns Corners of the whole piece, centred on y = 0.
 */
export function unfoldAtFold(half: readonly Point[]): Point[] {
  const run = foldRuns(half)[0];
  if (!run) return [...half, ...[...half].reverse().map((p) => pt(p.x, -p.y))];
  const [first, length] = run;
  const n = half.length;
  const body: Point[] = [];
  for (let k = 0; k <= n - length + 1; k += 1) body.push(half[(first + length - 1 + k) % n]!);
  const mirrored = [...body].reverse().map((p) => pt(p.x, -p.y));
  return [...body, ...mirrored.slice(1, -1)];
}
