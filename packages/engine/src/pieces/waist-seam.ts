/**
 * The skirt waist seam as the pieces sew it (issues #137, #140): darts closed, gathers drawn up to their marks and
 * pleat intakes folded away. Shared by the panel-skirt closure rule and the waistband module.
 */
import type { Mark } from "@tafsila/schemas";
import { distance } from "../geometry";
import type { PieceDraft } from "../pipeline/draft-context";
import { edgeLengthMm } from "./measure";

/** The edge every skirt piece joins the waist finish at. */
export const WAIST_EDGE_ID = "waist";

/** How the gathers are counted: drawn up to the mark (`sewn`), or let out flat for elastic to gather (`relaxed`). */
export type WaistGathers = "sewn" | "relaxed";

/**
 * How much a mark changes the sewn length of its edge: a gather run becomes `lengthMm` (unless relaxed); a pleat
 * arrow folds its own length away; other marks change nothing.
 *
 * @param mark - A mark on the waist edge.
 * @param gathers - Whether gathers are drawn up or let out.
 * @returns Change in mm (negative shortens).
 */
function closureChangeMm(mark: Mark, gathers: WaistGathers): number {
  if (mark.shape === "point") return 0;
  const runMm = distance(mark.from, mark.to);
  if (mark.kind === "gather") return gathers === "sewn" ? (mark.lengthMm ?? runMm) - runMm : 0;
  return mark.kind === "pleat-direction" ? -runMm : 0;
}

/**
 * Sewn waist length of one piece after its darts, pleats and (unless relaxed) gathers are closed.
 *
 * @param piece - A piece with a waist edge.
 * @param gathers - `sewn` (default) draws gathers up to their marks; `relaxed` leaves them flat.
 * @returns Length in mm.
 */
export function closedWaistMm(piece: PieceDraft, gathers: WaistGathers = "sewn"): number {
  const changeMm = (piece.marks ?? [])
    .filter((mark) => mark.edgeId === WAIST_EDGE_ID)
    .reduce((sum, mark) => sum + closureChangeMm(mark, gathers), 0);
  return edgeLengthMm(piece, WAIST_EDGE_ID, { closeDarts: true }) + changeMm;
}

/** Id prefix of the bodice pieces, whose waist edge is the other side of a dress waist seam (#144). */
const BODICE_ID_PREFIX = "bodice-";

/**
 * The main-fabric pieces that carry a waist edge: the skirt's, or with `bodice`, the bodice's (a dress, #144).
 *
 * @param pieces - Pieces drafted so far.
 * @param part - `skirt` (default) or `bodice`.
 * @returns The waist pieces of that part, in their drafted order.
 */
export function waistPieces(pieces: readonly PieceDraft[], part: "skirt" | "bodice" = "skirt"): PieceDraft[] {
  return pieces.filter(
    (piece) =>
      piece.cut.fabric === "main" &&
      piece.id.startsWith(BODICE_ID_PREFIX) === (part === "bodice") &&
      piece.edges.some((edge) => edge.id === WAIST_EDGE_ID),
  );
}
