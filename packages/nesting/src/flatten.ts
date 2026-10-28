/**
 * Cut line to nesting outline: flatten the curves, simplify with Douglas-Peucker and push the result out by the
 * tolerance, so the outline never lies inside the real cut line (ADR-313 item 3).
 */
import {
  type Point,
  distancePointToSegment,
  lineSeg,
  offsetPath,
  samePoint,
  samplePath,
  signedArea,
} from "@tafsila/engine/geometry";
import type { Path } from "@tafsila/schemas";
import { MIN_POLYGON_CORNERS, SIMPLIFY_TOLERANCE_MM } from "./constants";

/**
 * Flattens a closed path into polygon corners, dropping repeated points and the closing point.
 *
 * @param path - A closed cut path.
 * @returns Corners in path order.
 */
export function flattenPath(path: Path): Point[] {
  const corners: Point[] = [];
  for (const p of samplePath(path)) {
    const last = corners.at(-1);
    if (!last || !samePoint(last, p)) corners.push(p);
  }
  if (corners.length > 1 && samePoint(corners[0]!, corners.at(-1)!)) corners.pop();
  return corners;
}

/**
 * Douglas-Peucker on an open polyline (Douglas & Peucker 1973): keeps the ends and every corner farther than the
 * tolerance from the simplified line.
 *
 * @param points - Polyline points, at least two.
 * @param toleranceMm - Largest distance a dropped point may lie from the result.
 * @returns The kept points, ends included.
 */
export function simplifyPolyline(points: readonly Point[], toleranceMm: number): Point[] {
  const first = points[0]!;
  const last = points.at(-1)!;
  let farthest = -1;
  let farthestMm = toleranceMm;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = distancePointToSegment(points[i]!, first, last);
    if (d > farthestMm) {
      farthest = i;
      farthestMm = d;
    }
  }
  if (farthest < 0) return [first, last];
  const head = simplifyPolyline(points.slice(0, farthest + 1), toleranceMm);
  const tail = simplifyPolyline(points.slice(farthest), toleranceMm);
  return [...head.slice(0, -1), ...tail];
}

/**
 * Index of the corner farthest from the first one (a stable second split point for a closed polygon).
 *
 * @param corners - Polygon corners.
 * @returns The index.
 */
function farthestFromFirst(corners: readonly Point[]): number {
  const start = corners[0]!;
  let best = 0;
  corners.forEach((p, i) => {
    const b = corners[best]!;
    if (Math.hypot(p.x - start.x, p.y - start.y) > Math.hypot(b.x - start.x, b.y - start.y)) best = i;
  });
  return best;
}

/**
 * Douglas-Peucker on a closed polygon: split at the first corner and the one farthest from it, simplify both halves.
 *
 * @param corners - Polygon corners (no closing point).
 * @param toleranceMm - Largest distance a dropped corner may lie from the result.
 * @returns The kept corners (no closing point).
 */
export function simplifyPolygon(corners: readonly Point[], toleranceMm: number): Point[] {
  if (corners.length <= MIN_POLYGON_CORNERS) return [...corners];
  const split = farthestFromFirst(corners);
  const there = simplifyPolyline(corners.slice(0, split + 1), toleranceMm);
  const back = simplifyPolyline([...corners.slice(split), corners[0]!], toleranceMm);
  return [...there.slice(0, -1), ...back.slice(0, -1)];
}

/**
 * Pushes a polygon out by a distance with the engine's mitred offset (square-cut past the mitre limit), which holds
 * every point within that distance of the polygon.
 *
 * @param corners - Polygon corners, either direction.
 * @param distanceMm - Outward distance in mm.
 * @returns The offset corners, anticlockwise in maths axes (positive signed area), no closing point.
 */
export function offsetOutward(corners: readonly Point[], distanceMm: number): Point[] {
  const ordered = signedArea(corners) >= 0 ? [...corners] : [...corners].reverse();
  const path = ordered.map((p, i) => lineSeg(p, ordered[(i + 1) % ordered.length]!));
  return flattenPath(offsetPath(path, distanceMm));
}

/**
 * The nesting outline of a cut path: flattened, simplified to the tolerance and pushed out by it.
 *
 * @param cutPath - The piece's closed cut path.
 * @param toleranceMm - Simplification tolerance; defaults to SIMPLIFY_TOLERANCE_MM.
 * @returns Outline corners that contain the real cut line.
 */
export function nestingOutline(cutPath: Path, toleranceMm: number = SIMPLIFY_TOLERANCE_MM): Point[] {
  return offsetOutward(simplifyPolygon(flattenPath(cutPath), toleranceMm), toleranceMm);
}
