/**
 * Finishing sub-step: seam allowance per edge and the cutting line (FR-PAT-03, issue #130, decision 130).
 * Each stitch-path segment gets the allowance of the edge that covers it; the stitch path is offset by those
 * distances with `offsetPath`, using the mirrored hem corner where a hem meets a seam and a mitre elsewhere.
 */
import {
  DEFAULT_SEAM_ALLOWANCE_MM,
  type Edge,
  type EngineOptions,
  type PieceEdgeKind,
} from "@tafsila/schemas";
import { FOLD_EDGE_KIND, HEM_EDGE_KIND } from "../constants/finishing";
import { DraftingError } from "../errors/drafting-error";
import { type CornerStyle, offsetPath, samplePath, signedArea } from "../geometry";
import { type PieceDraft, type Step, withPieces } from "../pipeline/draft-context";

/** Seam allowance settings of one run. */
type SeamAllowanceOptions = EngineOptions["seamAllowance"];

/** What the step knows about each stitch-path segment. */
interface SegmentPlan {
  /** Allowance per segment, in mm (always ≥ 0). */
  readonly allowancesMm: readonly number[];
  /** Kind of the edge covering each segment; undefined when no edge covers it. */
  readonly kinds: readonly (PieceEdgeKind | undefined)[];
}

/**
 * The seam allowance of one edge: 0 on a fold, else the per-edge override, else the default for its kind.
 *
 * @param pieceId - Id of the piece that owns the edge (the override key is "pieceId/edgeId").
 * @param edge - The edge.
 * @param options - Seam allowance settings.
 * @returns Allowance in mm.
 * @example
 * allowanceFor("skirt-front", { id: "hem", kind: "hem", ... }, defaults) // 30
 */
export function allowanceFor(pieceId: string, edge: Edge, options: SeamAllowanceOptions): number {
  if (edge.kind === FOLD_EDGE_KIND) return 0;
  const override = options.perEdgeMm[`${pieceId}/${edge.id}`];
  if (override !== undefined) return override;
  const kind = edge.kind ?? "other";
  return options.defaultsMm[kind] ?? DEFAULT_SEAM_ALLOWANCE_MM[kind];
}

/**
 * The segment indices an edge covers, from `fromSegment` to `toSegment` inclusive (wrapping past the last segment).
 *
 * @param edge - The edge.
 * @param segmentCount - Number of segments in the stitch path.
 * @param pieceId - Piece id, for the error message.
 * @returns Segment indices in order.
 * @throws {DraftingError} FINISHING_EDGE_OUT_OF_RANGE when an index is past the end of the path.
 */
function coveredSegments(edge: Edge, segmentCount: number, pieceId: string): number[] {
  if (edge.fromSegment >= segmentCount || edge.toSegment >= segmentCount) {
    throw new DraftingError(
      "FINISHING_EDGE_OUT_OF_RANGE",
      `${pieceId}/${edge.id} covers segments past the end of its ${segmentCount}-segment stitch path`,
    );
  }
  const count = ((edge.toSegment - edge.fromSegment + segmentCount) % segmentCount) + 1;
  return Array.from({ length: count }, (_, k) => (edge.fromSegment + k) % segmentCount);
}

/**
 * Allowance and edge kind per stitch-path segment. A segment no edge covers gets the `other` default.
 *
 * @param piece - The piece.
 * @param options - Seam allowance settings.
 * @returns One allowance and one kind per segment.
 * @throws {DraftingError} FINISHING_EDGES_OVERLAP when two edges cover the same segment (a block bug).
 */
export function segmentAllowances(piece: PieceDraft, options: SeamAllowanceOptions): SegmentPlan {
  const count = piece.stitchPath.length;
  const other = options.defaultsMm.other ?? DEFAULT_SEAM_ALLOWANCE_MM.other;
  const allowancesMm: number[] = Array.from({ length: count }, () => other);
  const kinds: (PieceEdgeKind | undefined)[] = Array.from({ length: count }, () => undefined);
  const owner: (string | undefined)[] = Array.from({ length: count }, () => undefined);
  for (const edge of piece.edges) {
    const allowanceMm = allowanceFor(piece.id, edge, options);
    for (const index of coveredSegments(edge, count, piece.id)) {
      if (owner[index] !== undefined) {
        throw new DraftingError(
          "FINISHING_EDGES_OVERLAP",
          `${piece.id}: edges ${owner[index]} and ${edge.id} both cover segment ${index}`,
        );
      }
      owner[index] = edge.id;
      allowancesMm[index] = allowanceMm;
      kinds[index] = edge.kind ?? "other";
    }
  }
  return { allowancesMm, kinds };
}

/**
 * True for an edge kind that is sewn as a seam (not a hem, not a fold); an uncovered segment counts as a seam.
 *
 * @param kind - Edge kind, or undefined for an uncovered segment.
 * @returns Whether the cut line there is a plain seam allowance.
 */
function isSeam(kind: PieceEdgeKind | undefined): boolean {
  return kind !== HEM_EDGE_KIND && kind !== FOLD_EDGE_KIND;
}

/**
 * The corner style after segment `index`: mirrored where a hem meets a seam, else mitre (decision 130).
 *
 * @param kinds - Edge kind per segment.
 * @param index - The corner joins segment `index` to the next one.
 * @returns The corner style.
 */
function cornerStyle(kinds: readonly (PieceEdgeKind | undefined)[], index: number): CornerStyle {
  const before = kinds[index];
  const after = kinds[(index + 1) % kinds.length];
  if (after === HEM_EDGE_KIND && isSeam(before)) return "mirror-hem-after";
  if (before === HEM_EDGE_KIND && isSeam(after)) return "mirror-hem-before";
  return "mitre";
}

/**
 * The cutting line of one piece. `offsetPath` moves a path with positive signed area outwards, so the distances are
 * negated for a clockwise path (the path is not reversed, so segment indices stay valid).
 *
 * @param piece - The piece.
 * @param plan - Allowance and kind per segment.
 * @returns The closed cut path.
 * @throws {DraftingError} GEOMETRY_OFFSET_FAILED, naming the piece, when a curve bends tighter than its allowance.
 */
function cutPathFor(piece: PieceDraft, plan: SegmentPlan): PieceDraft["stitchPath"] {
  const sign = signedArea(samplePath(piece.stitchPath)) >= 0 ? 1 : -1;
  try {
    return offsetPath(
      piece.stitchPath,
      plan.allowancesMm.map((mm) => sign * mm),
      { cornerAt: (index) => cornerStyle(plan.kinds, index) },
    );
  } catch (error) {
    if (error instanceof DraftingError) throw new DraftingError(error.code, `${piece.id}: ${error.message}`);
    throw error;
  }
}

/**
 * Adds the cutting line and each edge's seam allowance to one piece. Returns a new piece; edges are copied.
 *
 * @param piece - The piece from the modules.
 * @param options - Seam allowance settings.
 * @returns The piece with `cutPath` and `edge.seamAllowanceMm` filled.
 */
export function withSeamAllowance(piece: PieceDraft, options: SeamAllowanceOptions): PieceDraft {
  const plan = segmentAllowances(piece, options);
  const edges = piece.edges.map((edge) => ({
    ...edge,
    seamAllowanceMm: allowanceFor(piece.id, edge, options),
  }));
  return { ...piece, edges, cutPath: cutPathFor(piece, plan) };
}

/**
 * Finishing sub-step: seam allowance and cutting line for every piece (FR-PAT-03).
 *
 * @param ctx - Context after the modules.
 * @returns A new context whose pieces carry their cut paths.
 */
export const seamAllowanceStep: Step = (ctx) =>
  withPieces(
    ctx,
    ctx.pieces.map((piece) => withSeamAllowance(piece, ctx.options.seamAllowance)),
  );
