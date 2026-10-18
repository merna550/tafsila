/** Geometry-based body-line measurements used by the circumference validator (FR-VAL-03). */
import type { BodyLine, Piece, Point } from "@tafsila/schemas";
import { GEOMETRY_EPSILON_MM } from "../constants/geometry";
import {
  add,
  bbox,
  distance,
  intersectSegments,
  lineSeg,
  normalize,
  pt,
  type ReadonlyPath,
  samplePath,
  scale,
  sub,
} from "../geometry";
import { edgeLengthMm } from "./measure";

/** The piece fields needed to measure a declared body line. */
export type BodyLinePiece = Pick<Piece, "cut" | "stitchPath" | "edges" | "darts">;

/**
 * Number of full-garment copies represented by one drafted piece.
 *
 * @param piece - Piece with cutting instructions.
 * @returns Two for a half cut on a fold, otherwise its cut quantity.
 */
export function bodyLineMultiplier(piece: Pick<Piece, "cut">): number {
  return piece.cut.onFold ? 2 : piece.cut.quantity;
}

/**
 * Moves a probe's end points outwards along its first and last legs, so the probe always crosses the outline.
 *
 * @param points - Probe points, at least two.
 * @param reachMm - How far to extend each end.
 * @returns The extended probe.
 */
function extendProbe(points: readonly Point[], reachMm: number): Point[] {
  const first = points[0]!;
  const last = points.at(-1)!;
  const start = sub(first, scale(normalize(sub(points[1]!, first)), reachMm));
  const end = add(last, scale(normalize(sub(last, points[points.length - 2]!)), reachMm));
  return [start, ...points.slice(1, -1), end];
}

/**
 * Length of a probe polyline inside an outline: from its first to its last crossing, measured along the probe.
 *
 * @param path - Closed stitch path.
 * @param probe - Probe points, already reaching past the outline at both ends.
 * @returns The length in mm, or undefined when the probe crosses the outline fewer than twice.
 */
export function probeLengthMm(path: ReadonlyPath, probe: readonly Point[]): number | undefined {
  let startMm = 0;
  const along: number[] = [];
  for (let i = 1; i < probe.length; i += 1) {
    const leg = lineSeg(probe[i - 1]!, probe[i]!);
    const legMm = distance(leg.from, leg.to);
    for (const segment of path) {
      for (const hit of intersectSegments(leg, segment)) along.push(startMm + hit.t1 * legMm);
    }
    startMm += legMm;
  }
  if (along.length < 2) return undefined;
  const lengthMm = Math.max(...along) - Math.min(...along);
  return lengthMm > GEOMETRY_EPSILON_MM ? lengthMm : undefined;
}

/**
 * Measures one declared body line from the piece geometry.
 *
 * @param piece - Drafted piece.
 * @param line - Edge-backed, horizontal or polyline body-line declaration.
 * @returns The line length in mm, or undefined when the declaration cannot be measured.
 */
export function bodyLineLengthMm(piece: BodyLinePiece, line: BodyLine): number | undefined {
  if (line.kind === "edge") {
    if (!piece.edges.some((edge) => edge.id === line.edgeId)) return undefined;
    return edgeLengthMm(piece, line.edgeId, { closeDarts: true });
  }
  const box = bbox(samplePath(piece.stitchPath));
  const reachMm = box.maxX - box.minX + box.maxY - box.minY + 1;
  if (line.kind === "horizontal") {
    return probeLengthMm(piece.stitchPath, [pt(box.minX - 1, line.atMm), pt(box.maxX + 1, line.atMm)]);
  }
  return probeLengthMm(piece.stitchPath, extendProbe(line.points, reachMm));
}
