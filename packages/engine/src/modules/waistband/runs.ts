/**
 * The skirt waist seam split into runs, in the order a one-piece band meets them going round the body from the
 * closure (issue #140, decision 140, 2). Each run is one cut copy of one skirt piece's waist edge.
 */
import type { DesignSpec, Edge } from "@tafsila/schemas";
import { bodyLineMultiplier } from "../../pieces/body-lines";
import { edgeLengthMm } from "../../pieces/measure";
import { closedWaistMm, type WaistGathers, WAIST_EDGE_ID, waistPieces } from "../../pieces/waist-seam";
import type { PieceDraft } from "../../pipeline/draft-context";

/** One cut copy of a skirt piece's waist edge, as a band sews to it. */
export interface WaistRun {
  /** The skirt piece. */
  readonly pieceId: string;
  /** Length the band sews to: darts and pleats closed, gathers drawn up (`sewn`) or let out (`relaxed`). */
  readonly lengthMm: number;
  /** Edge length with the darts closed, which the seam-match rule measures on the skirt (FR-VAL-01). */
  readonly edgeMm: number;
}

/** Where a run sits round the body. */
type RunSlot = "front" | "back" | "panel";

/**
 * Which part of the body a skirt piece covers, from its id.
 *
 * @param pieceId - Skirt piece id.
 * @returns Front, back, or a panel of a split skirt.
 */
function slotOf(pieceId: string): RunSlot {
  if (pieceId.endsWith("-front")) return "front";
  return pieceId.endsWith("-back") ? "back" : "panel";
}

/**
 * Splits a list in two halves (the first half the shorter when odd).
 *
 * @param list - Runs of one slot.
 * @returns The two halves.
 */
function halves<T>(list: readonly T[]): [T[], T[]] {
  const cut = Math.floor(list.length / 2);
  return [list.slice(0, cut), list.slice(cut)];
}

/**
 * Orders the runs from the closure round the body: centre back starts and ends in the back, centre front in the
 * front, a side closure (or none) runs front then back. Panels of a split skirt keep their order.
 *
 * @param runs - Runs grouped by slot.
 * @param position - Closure position.
 * @returns The runs in band order.
 */
function orderRuns(
  runs: Readonly<Record<RunSlot, WaistRun[]>>,
  position: DesignSpec["closure"]["position"],
): WaistRun[] {
  const [backA, backB] = halves(runs.back);
  const [frontA, frontB] = halves(runs.front);
  if (position === "center-back") return [...backA, ...runs.front, ...backB, ...runs.panel];
  if (position === "center-front") return [...frontA, ...runs.back, ...frontB, ...runs.panel];
  return [...runs.front, ...runs.back, ...runs.panel];
}

/**
 * The waist runs of the drafted skirt, in band order.
 *
 * @param pieces - Pieces drafted so far.
 * @param position - Closure position, where the band starts.
 * @param gathers - Gathers drawn up (`sewn`, a band) or let out (`relaxed`, an elastic casing).
 * @returns One run per cut copy of each skirt waist edge.
 */
export function waistRuns(
  pieces: readonly PieceDraft[],
  position: DesignSpec["closure"]["position"],
  gathers: WaistGathers,
): WaistRun[] {
  const grouped: Record<RunSlot, WaistRun[]> = { front: [], back: [], panel: [] };
  for (const piece of waistPieces(pieces)) {
    const run: WaistRun = {
      pieceId: piece.id,
      lengthMm: closedWaistMm(piece, gathers),
      edgeMm: edgeLengthMm(piece, WAIST_EDGE_ID, { closeDarts: true }),
    };
    grouped[slotOf(piece.id)].push(...Array.from({ length: bodyLineMultiplier(piece) }, () => run));
  }
  return orderRuns(grouped, position);
}

/**
 * The pair a band edge declares with the skirt waist it sews to. Gathers and pleats make the skirt edge longer
 * than the band on purpose; that difference is declared as intended ease, never hidden (decision 140, 2).
 *
 * @param run - The waist run.
 * @returns The `pairsWith` value.
 */
export function waistPair(run: WaistRun): NonNullable<Edge["pairsWith"]> {
  return { pieceId: run.pieceId, edgeId: WAIST_EDGE_ID, intendedEaseMm: run.lengthMm - run.edgeMm };
}
