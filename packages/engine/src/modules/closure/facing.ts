/**
 * The front facing of a button closure (issue #143, decision 143, 4): the band of the extended front piece within
 * `FRONT_FACING_WIDTH_MM` of the centre front, extension included, traced from the piece's own outline so its edges
 * match the neck, hem and extension exactly. Cut as a mirrored pair, plus an interfacing. Aldrich 6th ed., ch. 3,
 * facings for button fronts.
 */
import type { Edge, PieceEdgeKind, Point, Segment } from "@tafsila/schemas";
import { BAND_GRAIN_SHARE } from "../../constants/waistband";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  bbox,
  dot,
  intersectSegments,
  lerp,
  lineSeg,
  normalize,
  perpendicular,
  pointOnSegment,
  samplePath,
  scale,
  splitSegmentAt,
  sub,
} from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Id of the facing's inner, neatened edge. */
export const FACING_INNER_EDGE_ID = "inner";

/**
 * Prefix of a facing edge traced along a shell edge (`along-neck`, `along-hem`): the facing is not the shell, so it
 * must not answer to the shell's edge ids (the waistband finds the skirt by its `waist` edge).
 */
export const FACING_ALONG_PREFIX = "along-";

/** Crossings closer than this to a segment end are the end itself (parameter units). */
const END_EPSILON = 1e-9;

/** A traced segment and the shell edge it came from. */
interface Traced {
  /** The segment. */
  readonly segment: Segment;
  /** Id of the shell edge it lies on, or the inner edge. */
  readonly source: string;
}

/** The band to keep: points no deeper than `widthMm` inwards from the centre line. */
interface Band {
  /** A point on the centre line. */
  readonly origin: Point;
  /** Unit vector inwards, away from the opening. */
  readonly inward: Point;
  /** Depth of the band, in mm. */
  readonly widthMm: number;
  /** The clip line, long enough to cross the whole piece. */
  readonly clip: Segment;
}

/**
 * The band of a piece whose centre edge already carries the extension (the end before it steps out from the line).
 *
 * @param piece - The extended piece.
 * @param edgeId - The extension edge.
 * @param widthMm - Depth of the band inwards from the centre line.
 * @returns The band.
 */
function bandOf(piece: PieceDraft, edgeId: string, widthMm: number): Band {
  const edge = piece.edges.find((e) => e.id === edgeId)!;
  const step = piece.stitchPath[edge.fromSegment - 1]!;
  const inward = normalize(sub(step.from, step.to));
  const box = bbox(samplePath(piece.stitchPath));
  const reachMm = box.maxX - box.minX + box.maxY - box.minY;
  const centre = add(step.from, scale(inward, widthMm));
  const along = scale(perpendicular(inward), reachMm);
  return { origin: step.from, inward, widthMm, clip: lineSeg(sub(centre, along), add(centre, along)) };
}

/**
 * Splits a segment where it crosses the clip line and keeps the parts inside the band.
 *
 * @param segment - One outline segment.
 * @param band - The band.
 * @returns The inside parts, in order, each flagged with whether it starts right after an outside part.
 */
function insideParts(segment: Segment, band: Band): { segment: Segment; inside: boolean }[] {
  const cuts = intersectSegments(segment, band.clip)
    .map((c) => c.t1)
    .filter((t) => t > END_EPSILON && t < 1 - END_EPSILON)
    .sort((a, b) => a - b);
  const parts: Segment[] = [];
  let rest = segment;
  let done = 0;
  for (const t of cuts) {
    const [head, tail] = splitSegmentAt(rest, (t - done) / (1 - done));
    parts.push(head);
    rest = tail;
    done = t;
  }
  parts.push(rest);
  return parts.map((part) => ({
    segment: part,
    inside: dot(sub(pointOnSegment(part, 1 / 2), band.origin), band.inward) <= band.widthMm,
  }));
}

/**
 * Id of the shell edge covering a segment index.
 *
 * @param edges - Shell edges.
 * @param index - Segment index.
 * @returns The edge id, or the inner edge id for an uncovered segment.
 */
function sourceOf(edges: readonly Edge[], index: number): string {
  return edges.find((e) => index >= e.fromSegment && index <= e.toSegment)?.id ?? FACING_INNER_EDGE_ID;
}

/**
 * Traces the facing outline: the shell outline from the extension round, inside the band, closed by one straight
 * inner edge along the clip line.
 *
 * @param piece - The extended shell piece.
 * @param edgeId - The extension edge.
 * @param widthMm - Depth of the band inwards from the centre line.
 * @returns The traced segments, starting with the extension.
 * @throws {DraftingError} CLOSURE_FACING_INVALID when the band does not leave and re-enter the outline once.
 */
export function traceFacing(piece: PieceDraft, edgeId: string, widthMm: number): Traced[] {
  const band = bandOf(piece, edgeId, widthMm);
  const count = piece.stitchPath.length;
  const start = piece.edges.find((e) => e.id === edgeId)!.fromSegment - 1;
  const traced: Traced[] = [];
  let exit: Point | undefined;
  let joins = 0;
  for (let k = 0; k < count; k += 1) {
    const index = (start + k) % count;
    for (const part of insideParts(piece.stitchPath[index]!, band)) {
      if (!part.inside) {
        exit ??= traced.at(-1)?.segment.to;
        continue;
      }
      if (exit) {
        traced.push({ segment: lineSeg(exit, part.segment.from), source: FACING_INNER_EDGE_ID });
        exit = undefined;
        joins += 1;
      }
      traced.push({ segment: part.segment, source: sourceOf(piece.edges, index) });
    }
  }
  if (joins !== 1 || exit) {
    throw new DraftingError(
      "CLOSURE_FACING_INVALID",
      `${piece.id}: the front facing band does not cut the outline once`,
    );
  }
  return traced;
}

/** One facing edge before its segment range is known. */
interface FacingEdge {
  /** Edge id (the shell edge it traces, or `inner`). */
  readonly id: string;
  /** Number of consecutive segments. */
  readonly segments: number;
}

/**
 * Groups consecutive traced segments by the shell edge they came from.
 *
 * @param traced - The traced outline.
 * @returns One group per run; a repeated id gets a numbered suffix.
 */
function groups(traced: readonly Traced[]): FacingEdge[] {
  const runs: { id: string; segments: number }[] = [];
  for (const t of traced) {
    const last = runs.at(-1);
    if (last && last.id === t.source) last.segments += 1;
    else runs.push({ id: t.source, segments: 1 });
  }
  return runs.map((run, i) => {
    const before = runs.slice(0, i).filter((r) => r.id === run.id).length;
    return before === 0 ? run : { ...run, id: `${run.id}-${before + 1}` };
  });
}

/**
 * Builds the facing edges: each traced shell edge keeps its kind under an `along-` id, the extension keeps its id and
 * pairs with the shell's extension (same direction), the inner edge is neatened (`other`).
 *
 * @param shell - The extended shell piece.
 * @param traced - The traced outline.
 * @param paired - Whether to declare the pair (the facing) or not (the interfacing).
 * @param edgeId - The extension edge.
 * @returns The edges.
 */
export function facingEdges(
  shell: PieceDraft,
  traced: readonly Traced[],
  paired: boolean,
  edgeId: string,
): Edge[] {
  let next = 0;
  return groups(traced).map((group) => {
    const fromSegment = next;
    next += group.segments;
    const kind: PieceEdgeKind = shell.edges.find((e) => e.id === group.id)?.kind ?? "other";
    const id =
      group.id === edgeId || group.id === FACING_INNER_EDGE_ID
        ? group.id
        : `${FACING_ALONG_PREFIX}${group.id}`;
    const edge: Edge = { id, kind, fromSegment, toSegment: next - 1, seamAllowanceMm: 0 };
    return paired && group.id === edgeId ? { ...edge, pairsWith: { pieceId: shell.id, edgeId } } : edge;
  });
}

/**
 * Grain line of a facing: parallel to the centre front, halfway across the band, over the band's middle share.
 *
 * @param shell - The extended shell piece.
 * @param edgeId - The extension edge.
 * @param widthMm - Depth of the band.
 * @returns The grain line ends.
 */
export function facingGrain(shell: PieceDraft, edgeId: string, widthMm: number): [Point, Point] {
  const edge = shell.edges.find((e) => e.id === edgeId)!;
  const step = shell.stitchPath[edge.fromSegment - 1]!;
  const back = shell.stitchPath[edge.toSegment + 1]!;
  const inward = normalize(sub(step.from, step.to));
  const top = add(step.from, scale(inward, widthMm / 2));
  const bottom = add(back.to, scale(inward, widthMm / 2));
  return [lerp(top, bottom, BAND_GRAIN_SHARE.from), lerp(top, bottom, BAND_GRAIN_SHARE.to)];
}
