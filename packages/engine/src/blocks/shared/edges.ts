/** Named edges of a block outline, built from segment counts in path order (issue #128). */
import type { Edge, EngineOptions, PieceEdgeKind } from "@tafsila/schemas";
import { allowanceFor } from "../../finishing/seam-allowance";

/** One edge of an outline: its id, its kind and how many consecutive path segments it covers. */
export interface EdgeSpec {
  /** Edge id, unique in the piece (`neck`, `side`, ...). */
  readonly id: string;
  /** Seam-allowance kind, or `fold` (decision 130). */
  readonly kind: PieceEdgeKind;
  /** Number of consecutive segments of the outline in this edge. */
  readonly segments: number;
  /** The edge it is sewn to, with any intended ease. */
  readonly pairsWith?: Edge["pairsWith"];
}

/**
 * Turns edge specs in path order into `Edge`s with segment ranges, kinds and seam allowances. The allowance
 * comes from the finishing step's `allowanceFor` (per-edge override, then kind default, 0 on a fold).
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
    const base: Edge = { id: spec.id, kind: spec.kind, fromSegment, toSegment: next - 1, seamAllowanceMm: 0 };
    const edge: Edge = { ...base, seamAllowanceMm: allowanceFor(pieceId, base, options.seamAllowance) };
    return spec.pairsWith ? { ...edge, pairsWith: spec.pairsWith } : edge;
  });
}
