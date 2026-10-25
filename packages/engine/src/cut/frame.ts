/**
 * The reference frame a tailor measures a piece from (issue #284, ADR-281 item 5): the fold line, or a line parallel to
 * the grain through the selvedge side, plus the top line square to it through the top of the cut line.
 */
import type { Piece, Point } from "@tafsila/schemas";
import { CUT_FOLD_STRAIGHT_TOLERANCE_MM, CUT_FRAME_SAMPLES_PER_CURVE } from "../constants/cut";
import { DraftingError } from "../errors/drafting-error";
import { add, distancePointToSegment, dot, normalize, pt, samplePath, scale, sub } from "../geometry";
import { edgeSegments } from "../pieces/measure";
import type { CutFrame } from "./types";

/** A position in a frame: mm down the reference and mm from it into the piece. */
export interface FramePosition {
  /** Distance down the reference from the top line, mm. */
  readonly along: number;
  /** Distance from the reference into the piece, mm. */
  readonly across: number;
}

/** The parts of a piece the frame reads. */
export type FramedPiece = Pick<Piece, "stitchPath" | "cutPath" | "edges" | "darts" | "grainLine">;

/**
 * The reference line of a piece before its origin is known: a point on it, its direction and its kind.
 *
 * @param piece - The piece.
 * @returns A point on the line, its unit direction (any sign) and the frame kind.
 * @throws {DraftingError} CUT_FOLD_NOT_STRAIGHT when the fold edge bends.
 */
function referenceLine(piece: FramedPiece): { base: Point; direction: Point; kind: CutFrame["kind"] } {
  const fold = piece.edges.find((edge) => edge.kind === "fold");
  if (!fold) {
    const [from, to] = piece.grainLine;
    return { base: from, direction: normalize(sub(to, from)), kind: "grain" };
  }
  const segments = edgeSegments(piece, fold.id);
  const start = segments[0]!.from;
  const end = segments.at(-1)!.to;
  const bent = samplePath(segments).some(
    (p) => distancePointToSegment(p, start, end) > CUT_FOLD_STRAIGHT_TOLERANCE_MM,
  );
  if (bent) throw new DraftingError("CUT_FOLD_NOT_STRAIGHT", `Fold edge "${fold.id}" is not a straight line`);
  return { base: start, direction: normalize(sub(end, start)), kind: "fold" };
}

/**
 * Turns a reference direction so it points down the sheet (+y), or to the right (+x) when it is horizontal.
 *
 * @param direction - Unit direction of the reference, either sign.
 * @returns The same line's direction pointing down.
 */
function pointDown(direction: Point): Point {
  const downward = Math.abs(direction.y) > Number.EPSILON ? direction.y > 0 : direction.x > 0;
  return downward ? direction : scale(direction, -1);
}

/**
 * The reference frame of a piece. A piece with a `fold` edge is measured from the fold; any other from a line parallel
 * to its grain line through its leftmost cut point (the selvedge side). The origin is on the reference, level with the
 * top of the cut line, so every cut point is at along ≥ 0 and across ≥ 0.
 *
 * @param piece - The piece.
 * @returns The frame.
 * @throws {DraftingError} CUT_FOLD_NOT_STRAIGHT when the fold edge bends more than 0.1 mm.
 * @example
 * cutFrame(rectangleOnFold).kind // "fold"
 */
export function cutFrame(piece: FramedPiece): CutFrame {
  const line = referenceLine(piece);
  const along = pointDown(line.direction);
  const right = pt(along.y, -along.x);
  const samples = samplePath(piece.cutPath, CUT_FRAME_SAMPLES_PER_CURVE);
  const acrossValues = samples.map((p) => dot(sub(p, line.base), right));
  const minAcross = Math.min(...acrossValues);
  const maxAcross = Math.max(...acrossValues);
  const flip = line.kind === "fold" && Math.abs(minAcross) > Math.abs(maxAcross);
  const across = flip ? scale(right, -1) : right;
  const offsetAcross = line.kind === "fold" ? 0 : minAcross;
  const minAlong = Math.min(...samples.map((p) => dot(sub(p, line.base), along)));
  const origin = add(line.base, add(scale(along, minAlong), scale(across, offsetAcross)));
  return { kind: line.kind, origin, along, across };
}

/**
 * Where a piece point lies in the frame.
 *
 * @param frame - The frame.
 * @param p - A point in piece coordinates, mm.
 * @returns Its distances down and across the reference, mm.
 */
export function toFrame(frame: CutFrame, p: Point): FramePosition {
  const offset = sub(p, frame.origin);
  return { along: dot(offset, frame.along), across: dot(offset, frame.across) };
}

/**
 * The piece point at the given distances in the frame; the inverse of {@link toFrame}.
 *
 * @param frame - The frame.
 * @param along - Distance down the reference, mm.
 * @param across - Distance from the reference into the piece, mm.
 * @returns The point in piece coordinates, mm.
 */
export function fromFrame(frame: CutFrame, along: number, across: number): Point {
  return add(frame.origin, add(scale(frame.along, along), scale(frame.across, across)));
}
