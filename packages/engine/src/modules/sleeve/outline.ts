/**
 * A sleeve outline in parts (issue #142): the two cap halves and the tail (front underarm seam, hem, back underarm
 * seam). The puff and bishop sleeves reshape parts of the set-in block and rebuild the piece from them, so its edges,
 * pairs and notches follow the new lengths (decision 142, 2).
 */
import type { EngineOptions, Mark } from "@tafsila/schemas";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import type { BodiceArmholeParts } from "../../blocks/bodice/armhole-parts";
import { SLEEVE_EDGE, SLEEVE_PIECE_ID } from "../../blocks/sleeve/ids";
import { sleeveCapNotches } from "../../blocks/sleeve/notches";
import { SLEEVE_GRAIN_END_INSET_MM } from "../../constants/sleeve-block";
import { pathLength, pt, type Segment } from "../../geometry";
import { edgeSegments } from "../../pieces/measure";
import type { PieceDraft } from "../../pipeline/draft-context";

/** The parts of a full sleeve outline, in path order. */
export interface SleeveOutline {
  /** Back cap, back underarm to the shoulder point. */
  readonly capBack: readonly Segment[];
  /** Front cap, shoulder point to the front underarm. */
  readonly capFront: readonly Segment[];
  /** Front underarm seam, hem and back underarm seam: three lines. */
  readonly tail: readonly [Segment, Segment, Segment];
}

/** What the rebuilt piece declares beyond its outline. */
export interface SleeveExtras {
  /** Extra cap length per half gathered on purpose, added to its declared ease to the armhole. */
  readonly gatherMm: { readonly back: number; readonly front: number };
  /** Construction marks of the sleeve. */
  readonly marks: readonly Mark[];
  /** Bodice pieces holding each armhole, for the balance notches. */
  readonly armholes: BodiceArmholeParts;
}

/**
 * The outline of a drafted set-in sleeve, in parts.
 *
 * @param piece - The set-in sleeve block piece.
 * @returns Its cap halves and tail.
 */
export function blockOutline(piece: PieceDraft): SleeveOutline {
  const tail = [SLEEVE_EDGE.underarmFront, SLEEVE_EDGE.hem, SLEEVE_EDGE.underarmBack].map(
    (id) => edgeSegments(piece, id)[0]!,
  );
  return {
    capBack: edgeSegments(piece, SLEEVE_EDGE.capBack),
    capFront: edgeSegments(piece, SLEEVE_EDGE.capFront),
    tail: [tail[0]!, tail[1]!, tail[2]!],
  };
}

/**
 * The block's edge pair with any gathered length added to its declared ease.
 *
 * @param block - The set-in sleeve block piece.
 * @param edgeId - A cap edge.
 * @param gatherMm - Length gathered on that half.
 * @returns The pair field, or nothing for a split (princess) armhole.
 */
function gatheredPair(block: PieceDraft, edgeId: string, gatherMm: number): Pick<EdgeSpec, "pairsWith"> {
  const pair = block.edges.find((e) => e.id === edgeId)?.pairsWith;
  if (!pair) return {};
  return { pairsWith: { ...pair, intendedEaseMm: (pair.intendedEaseMm ?? 0) + gatherMm } };
}

/**
 * The pair a rebuilt edge declares: a cap half adds its gathers to the block's declared ease; other edges keep theirs.
 *
 * @param block - The set-in sleeve block piece.
 * @param edge - The block edge.
 * @param gathers - Gathered length per cap edge id.
 * @returns The pair field, or nothing.
 */
function rebuiltPair(
  block: PieceDraft,
  edge: PieceDraft["edges"][number],
  gathers: Readonly<Record<string, number>>,
): Pick<EdgeSpec, "pairsWith"> {
  if (edge.id in gathers) return gatheredPair(block, edge.id, gathers[edge.id]!);
  return edge.pairsWith ? { pairsWith: edge.pairsWith } : {};
}

/**
 * Rebuilds the sleeve piece from a reshaped outline: same edges and pairs as the block, the cap halves declaring their
 * gathers, the balance notches measured on the new cap, the grain line down to the new hem.
 *
 * @param block - The set-in sleeve block piece.
 * @param outline - The reshaped outline.
 * @param extras - Gathers, marks and the bodice armhole pieces.
 * @param options - Engine options, for the seam allowances.
 * @returns The sleeve piece.
 */
export function sleeveFromOutline(
  block: PieceDraft,
  outline: SleeveOutline,
  extras: SleeveExtras,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  const counts: Readonly<Record<string, number>> = {
    [SLEEVE_EDGE.capBack]: outline.capBack.length,
    [SLEEVE_EDGE.capFront]: outline.capFront.length,
  };
  const gathers: Readonly<Record<string, number>> = {
    [SLEEVE_EDGE.capBack]: extras.gatherMm.back,
    [SLEEVE_EDGE.capFront]: extras.gatherMm.front,
  };
  const edges = buildEdges(
    SLEEVE_PIECE_ID,
    block.edges.map((edge): EdgeSpec => ({
      id: edge.id,
      kind: edge.kind ?? "other",
      segments: counts[edge.id] ?? 1,
      ...rebuiltPair(block, edge, gathers),
    })),
    options,
  );
  const hemYMm = outline.tail[1].from.y;
  const gatheredMm = extras.gatherMm.back + extras.gatherMm.front;
  return {
    ...block,
    stitchPath: [...outline.capBack, ...outline.capFront, ...outline.tail],
    edges,
    notches: sleeveCapNotches(pathLength(outline.capFront), extras.armholes),
    sleeveCap: { ...block.sleeveCap!, ...(gatheredMm > 0 ? { gatheredMm } : {}) },
    grainLine: [block.grainLine[0], pt(0, hemYMm - SLEEVE_GRAIN_END_INSET_MM)],
    ...(extras.marks.length > 0 ? { marks: [...extras.marks] } : {}),
  };
}
