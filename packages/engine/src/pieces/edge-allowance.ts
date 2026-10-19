/**
 * Per-edge seam allowances set by a module (issues #143, #145): a zip seam is wider, a patch pocket turns under less.
 * A value the user already chose for that edge is kept.
 */
import type { DraftContext } from "../pipeline/draft-context";

/**
 * Sets seam allowances on edges through the engine's per-edge table, keeping any allowance the user chose.
 *
 * @param ctx - Current context.
 * @param refs - `pieceId/edgeId` keys to set.
 * @param allowanceMm - The allowance for all of them, in mm.
 * @returns The context with the allowances set.
 */
export function withEdgeAllowance(
  ctx: DraftContext,
  refs: readonly string[],
  allowanceMm: number,
): DraftContext {
  const current = ctx.options.seamAllowance.perEdgeMm;
  const added = Object.fromEntries(
    refs.filter((ref) => current[ref] === undefined).map((ref) => [ref, allowanceMm]),
  );
  const seamAllowance = { ...ctx.options.seamAllowance, perEdgeMm: { ...current, ...added } };
  return Object.freeze({ ...ctx, options: { ...ctx.options, seamAllowance } });
}
