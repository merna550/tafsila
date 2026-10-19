/**
 * Where the pockets go on the front shell (issue #145): the waist level down the side seam, the room below it and the
 * patch rectangle in piece space. Pure helpers shared by the side-seam and the patch pocket.
 */
import type { Point } from "@tafsila/schemas";
import { DraftingError } from "../../errors/drafting-error";
import { samplePath } from "../../geometry";
import { edgeSegments } from "../../pieces/measure";
import { type ChainLink, chainLengthMm } from "../../pieces/seam-chain";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Id of the waist body line. */
const WAIST_MEASUREMENT = "waist";

/**
 * Sample points of an edge, top end (smaller y) first.
 *
 * @param piece - The piece.
 * @param edgeId - The edge.
 * @returns The points.
 */
export function edgePointsTopFirst(piece: PieceDraft, edgeId: string): Point[] {
  const points = samplePath(edgeSegments(piece, edgeId));
  return points[0]!.y <= points.at(-1)!.y ? points : [...points].reverse();
}

/**
 * Distance down an edge from its top to a level.
 *
 * @param piece - The piece.
 * @param edgeId - The edge.
 * @param y - The level, in piece space.
 * @returns Distance in mm along the edge.
 */
export function distanceDownToY(piece: PieceDraft, edgeId: string, y: number): number {
  const points = edgePointsTopFirst(piece, edgeId);
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [a, b] = [points[i - 1]!, points[i]!];
    const step = Math.hypot(b.x - a.x, b.y - a.y);
    if (b.y >= y && b.y > a.y) return total + (step * (y - a.y)) / (b.y - a.y);
    total += step;
  }
  return total;
}

/**
 * X of an edge at a level.
 *
 * @param piece - The piece.
 * @param edgeId - The edge.
 * @param y - The level.
 * @returns X in piece space.
 */
export function xOnEdgeAtY(piece: PieceDraft, edgeId: string, y: number): number {
  const points = edgePointsTopFirst(piece, edgeId);
  const i = Math.max(
    1,
    points.findIndex((p) => p.y >= y),
  );
  const [a, b] = [points[i - 1]!, points[i] ?? points.at(-1)!];
  return b.y === a.y ? a.x : a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
}

/**
 * The waist level of a one-piece front: the y of the side end of its waist body line.
 *
 * @param piece - A bodice piece.
 * @returns The level, or undefined when the piece has no polyline waist line.
 */
function polylineWaistY(piece: PieceDraft): number | undefined {
  const line = piece.bodyLines.find((l) => l.measurement === WAIST_MEASUREMENT && l.kind === "polyline");
  if (!line || line.kind !== "polyline") return undefined;
  return [...line.points].sort((a, b) => b.x - a.x)[0]!.y;
}

/**
 * Distance from the top of a side chain down to the waist: the start of the first skirt link, else the waist level of
 * a one-piece dress, else the end of the chain (a bodice that stops at the waist).
 *
 * @param chain - The side chain.
 * @returns Distance in mm.
 */
export function waistDownMm(chain: readonly ChainLink[]): number {
  const skirtLink = chain.find((l) => !l.piece.id.startsWith("bodice-"));
  if (skirtLink) return skirtLink.startMm;
  const first = chain[0]!;
  const y = polylineWaistY(first.piece);
  return y === undefined ? chainLengthMm(chain) : distanceDownToY(first.piece, first.edgeId, y);
}

/**
 * The y of the waist on the front piece at a given x.
 *
 * @param piece - The front shell piece.
 * @param x - X in piece space.
 * @returns The level.
 * @throws {DraftingError} POCKET_TARGET_MISSING when the piece has no waist.
 */
export function waistYAt(piece: PieceDraft, x: number): number {
  const line = piece.bodyLines.find((l) => l.measurement === WAIST_MEASUREMENT && l.kind === "polyline");
  if (line?.kind === "polyline") {
    const [a, b] = [...line.points].sort((p, q) => p.x - q.x) as [Point, Point];
    return b.x === a.x ? a.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  }
  const waist = piece.edges.find((e) => e.id === "waist");
  if (!waist)
    throw new DraftingError("POCKET_TARGET_MISSING", `${piece.id} has no waist to place a pocket from`);
  const points = samplePath(edgeSegments(piece, "waist"));
  return points.reduce((sum, p) => sum + p.y, 0) / points.length;
}
