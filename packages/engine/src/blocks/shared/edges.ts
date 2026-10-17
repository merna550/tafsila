/** Named edges of a block outline, built from segment counts in path order (issue #128, reused by #130). */
import type { Edge, EdgeKind, EngineOptions } from "@tafsila/schemas";

/** The kind of a block edge: a seam-allowance kind, or a fold that gets no allowance. */
export type BlockEdgeKind = EdgeKind | "fold";

/** One edge of an outline: its id, its kind and how many consecutive path segments it covers. */
export interface EdgeSpec {
  /** Edge id, unique in the piece (`neck`, `side`, ...). */
  readonly id: string;
  /** Seam-allowance kind, or `fold`. */
  readonly kind: BlockEdgeKind;
  /** Number of consecutive segments of the outline in this edge. */
  readonly segments: number;
  /** The edge it is sewn to, with any intended ease. */
  readonly pairsWith?: Edge["pairsWith"];
}

/**
 * Seam allowance of one edge: the per-edge override `"<pieceId>/<edgeId>"`, else the default of its kind.
 * A fold has none.
 *
 * @param options - Engine options with the seam allowance table.
 * @param pieceId - Piece id.
 * @param edgeId - Edge id.
 * @param kind - Edge kind.
 * @returns The allowance in mm.
 */
export function seamAllowanceFor(
  options: Pick<EngineOptions, "seamAllowance">,
  pieceId: string,
  edgeId: string,
  kind: BlockEdgeKind,
): number {
  if (kind === "fold") return 0;
  const perEdge = options.seamAllowance.perEdgeMm[`${pieceId}/${edgeId}`];
  return perEdge ?? options.seamAllowance.defaultsMm[kind];
}

/**
 * Turns edge specs in path order into `Edge`s with segment ranges and seam allowances.
 *
 * @param pieceId - Piece id, for the per-edge allowance key.
 * @param specs - Edges in path order; their segment counts add up to the outline.
 * @param options - Engine options with the seam allowance table.
 * @returns The edges.
 */
export function buildEdges(
  pieceId: string,
  specs: readonly EdgeSpec[],
  options: Pick<EngineOptions, "seamAllowance">,
): Edge[] {
  let next = 0;
  return specs.map((spec) => {
    const fromSegment = next;
    next += spec.segments;
    const edge: Edge = {
      id: spec.id,
      fromSegment,
      toSegment: next - 1,
      seamAllowanceMm: seamAllowanceFor(options, pieceId, spec.id, spec.kind),
    };
    return spec.pairsWith ? { ...edge, pairsWith: spec.pairsWith } : edge;
  });
}
