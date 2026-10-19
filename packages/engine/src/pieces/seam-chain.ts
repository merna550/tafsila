/**
 * The shell chain of an opening (issue #145, shared by the closure and the pocket modules, decision 145, 8): the pieces
 * a centre line or a side seam runs along, top to bottom, resolved by stable piece and edge ids, never by path index.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import { edgeLengthMm, edgeSegments } from "./measure";
import type { DraftContext, PieceDraft } from "../pipeline/draft-context";

/** The front or the back half of the garment. */
export type Half = "front" | "back";

/** A closure position on a centre line. */
export type CentrePosition = Exclude<DesignSpec["closure"]["position"], "side">;

/** Which half each centre position opens. */
export const CENTRE_HALF: Readonly<Record<CentrePosition, Half>> = {
  "center-back": "back",
  "center-front": "front",
};

/** Edge id of the centre line on the shell pieces (bodice, skirt, tiers). */
export const CENTRE_EDGE_ID: Readonly<Record<Half, string>> = { front: "cf", back: "cb" };

/** Edge id of the side seam on every shell piece. */
export const SIDE_EDGE_ID = "side";

/** The side seam a side zip goes in: the front's, paired with the back (the left side when worn). */
export const SIDE_ZIP_HALF: Half = "front";

/** One shell piece along an opening. */
export interface ChainLink {
  /** The piece. */
  readonly piece: PieceDraft;
  /** The edge the opening runs along. */
  readonly edgeId: string;
  /** Sewn length of that edge (darts closed), in mm. */
  readonly lengthMm: number;
  /** Distance of the link's top from the top of the opening, in mm. */
  readonly startMm: number;
}

/** A tiered-skirt band id in a piece id: `tier-2-front`, `tier-2-panel`. */
const TIER_ID = /^(tier-\d+)-(?:front|back|panel)$/;

/** Edge ids of a split skirt's panel: a panel seam takes the place of the centre line or of the side seam. */
export const PANEL_EDGE_ID = { centre: "seam-left", side: "seam-right" } as const;

/** One level of the opening: the pieces that may hold it, in order of preference, with their edge. */
type Level = readonly { readonly pieceId: string; readonly edgeId: string }[];

/**
 * The levels of one half, top first: the bodice (plain, or the princess panel that holds the edge), then each skirt
 * band (the skirt, or each tier), as its front or back piece or, when the band is split, its panel.
 *
 * @param pieces - All pieces.
 * @param half - Front or back.
 * @param centre - True for the centre line, false for the side seam.
 * @returns The levels.
 */
function levels(pieces: readonly PieceDraft[], half: Half, centre: boolean): Level[] {
  const edgeId = centre ? CENTRE_EDGE_ID[half] : SIDE_EDGE_ID;
  const panelEdge = centre ? PANEL_EDGE_ID.centre : PANEL_EDGE_ID.side;
  const tiers = [
    ...new Set(pieces.map((p) => TIER_ID.exec(p.id)?.[1]).filter((id): id is string => id !== undefined)),
  ].sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));
  /**
   * The level of one skirt band: its piece on this half, or its panel when split.
   *
   * @param id - Band id (`skirt`, `tier-2`).
   * @returns The level.
   */
  const band = (id: string): Level => [
    { pieceId: `${id}-${half}`, edgeId },
    { pieceId: `${id}-panel`, edgeId: panelEdge },
  ];
  const bodice = centre ? `bodice-${half}-centre` : `bodice-${half}-side`;
  return [
    [
      { pieceId: `bodice-${half}`, edgeId },
      { pieceId: bodice, edgeId },
    ],
    band("skirt"),
    ...tiers.map(band),
  ];
}

/**
 * The shell chain of an opening, top to bottom.
 *
 * @param ctx - Context after the garment modules.
 * @param half - The half whose edges the opening runs along.
 * @param centre - True for the centre line, false for the side seam.
 * @returns The links, each with its start distance.
 * @throws {DraftingError} CLOSURE_TARGET_MISSING when a shell piece lacks the edge, or no piece holds it.
 */
export function openingChain(ctx: DraftContext, half: Half, centre: boolean): ChainLink[] {
  const found = levels(ctx.pieces, half, centre).flatMap((level) => {
    const hit = level.flatMap((t) =>
      ctx.pieces.filter((p) => p.id === t.pieceId).map((piece) => ({ piece, ...t })),
    );
    return hit.slice(0, 1);
  });
  const missing = found.filter(({ piece, edgeId }) => !piece.edges.some((e) => e.id === edgeId));
  if (missing.length > 0 || found.length === 0) {
    const refs =
      missing.map((m) => `${m.piece.id}/${m.edgeId}`).join(", ") || `${half}/${centre ? "centre" : "side"}`;
    throw new DraftingError("CLOSURE_TARGET_MISSING", `The closure cannot find its edge: ${refs}`);
  }
  let startMm = 0;
  return found.map(({ piece, edgeId }) => {
    const lengthMm = edgeLengthMm(piece, edgeId, { closeDarts: true });
    const link = { piece, edgeId, lengthMm, startMm };
    startMm += lengthMm;
    return link;
  });
}

/**
 * Total length of an opening chain.
 *
 * @param chain - The links.
 * @returns Length in mm.
 */
export function chainLengthMm(chain: readonly ChainLink[]): number {
  const last = chain.at(-1);
  return last ? last.startMm + last.lengthMm : 0;
}

/**
 * The link a distance from the top falls on, and the distance down that link (the last link takes the bottom end).
 *
 * @param chain - The links.
 * @param fromTopMm - Distance from the top of the opening.
 * @returns The link and the distance from its top.
 */
export function locateOnChain(
  chain: readonly ChainLink[],
  fromTopMm: number,
): { link: ChainLink; downMm: number } {
  const link = chain.find((l) => fromTopMm <= l.startMm + l.lengthMm) ?? chain.at(-1)!;
  return { link, downMm: fromTopMm - link.startMm };
}

/**
 * Distance along an edge from its start, for a distance down from its top (the end with the smaller y).
 *
 * @param link - The chain link.
 * @param downMm - Distance from the link's top.
 * @returns Distance from the edge start.
 */
export function atFromEdgeStart(link: ChainLink, downMm: number): number {
  const segments = edgeSegments(link.piece, link.edgeId);
  const startsAtTop = segments[0]!.from.y <= segments.at(-1)!.to.y;
  return startsAtTop ? downMm : link.lengthMm - downMm;
}
