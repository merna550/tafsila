/**
 * Side-seam pockets (issue #145, decision 145, 3): a notch at each end of the opening on the front side seam (the back
 * partner is written by the notch step), and two bag pieces. A bag's straight `along-side` edge sews to the shell
 * between the notches; its rounded `outer` edge sews to the other bag's.
 */
import type { Notch } from "@tafsila/schemas";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import {
  BAG_GRAIN,
  POCKET_BAG_CORNER_RADIUS_MM,
  POCKET_BAG_DEPTH_MM,
  POCKET_BAG_EXTENSION_MM,
  POCKET_HEM_CLEARANCE_MM,
  POCKET_OPENING_MM,
  POCKET_OPENING_TOP_BELOW_WAIST_MM,
} from "../../constants/pocket";
import { DraftingError } from "../../errors/drafting-error";
import { arcToCubics, lineSeg, pt, type Segment } from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import {
  atFromEdgeStart,
  type ChainLink,
  chainLengthMm,
  locateOnChain,
  openingChain,
} from "../../pieces/seam-chain";
import { type DraftContext, type PieceDraft, withPieces } from "../../pipeline/draft-context";
import { waistDownMm } from "./placement";

/** Notch ids at the two ends of the opening, on the shell and on the bags. */
export const POCKET_TOP_NOTCH_ID = "pocket-top";
/** The lower end of the opening. */
export const POCKET_BOTTOM_NOTCH_ID = "pocket-bottom";

/** Edge of a bag that sews to the shell. */
export const BAG_ALONG_SIDE_EDGE_ID = "along-side";
/** Edge of a bag that sews to the other bag. */
export const BAG_OUTER_EDGE_ID = "outer";

/** The two bags. */
export const BAG_IDS = ["pocket-bag-front", "pocket-bag-back"] as const;

/** Quarter turn. */
const QUARTER_TURN_RAD = Math.PI / 2;

/**
 * The outline of a bag: the straight edge down x = 0, then the rounded outer edge round to the top.
 *
 * @param lengthMm - Length of the straight edge.
 * @returns The segments and how many belong to the outer edge.
 */
function bagOutline(lengthMm: number): { path: Segment[]; outerSegments: number } {
  const [d, r] = [POCKET_BAG_DEPTH_MM, POCKET_BAG_CORNER_RADIUS_MM];
  const lower = arcToCubics({
    center: pt(d - r, lengthMm - r),
    radiusMm: r,
    fromRad: QUARTER_TURN_RAD,
    toRad: 0,
  });
  const upper = arcToCubics({ center: pt(d - r, r), radiusMm: r, fromRad: 0, toRad: -QUARTER_TURN_RAD });
  const outer: Segment[] = [
    lineSeg(pt(0, lengthMm), pt(d - r, lengthMm)),
    ...lower,
    lineSeg(pt(d, lengthMm - r), pt(d, r)),
    ...upper,
    lineSeg(pt(d - r, 0), pt(0, 0)),
  ];
  return { path: [lineSeg(pt(0, 0), pt(0, lengthMm)), ...outer], outerSegments: outer.length };
}

/**
 * Builds the notches of a bag, each paired with the same notch of the other bag.
 *
 * @param other - The other bag's id.
 * @returns A function from notch id and position to the notch.
 */
function bagNotch(other: string): (id: string, atMm: number) => Notch {
  return (id, atMm) => ({
    id,
    edgeId: BAG_ALONG_SIDE_EDGE_ID,
    atMm,
    pairsWith: { pieceId: other, edgeId: BAG_ALONG_SIDE_EDGE_ID },
  });
}

/**
 * One bag piece.
 *
 * @param ctx - Context, for the seam allowances.
 * @param id - `pocket-bag-front` or `pocket-bag-back`.
 * @returns The piece.
 */
function bagPiece(ctx: DraftContext, id: (typeof BAG_IDS)[number]): PieceDraft {
  const lengthMm = POCKET_OPENING_MM + 2 * POCKET_BAG_EXTENSION_MM;
  const other = BAG_IDS.find((b) => b !== id)!;
  const { path, outerSegments } = bagOutline(lengthMm);
  const outerPair: Pick<EdgeSpec, "pairsWith"> = {
    pairsWith: { pieceId: other, edgeId: BAG_OUTER_EDGE_ID, intendedEaseMm: 0 },
  };
  const edges = buildEdges(
    id,
    [
      { id: BAG_ALONG_SIDE_EDGE_ID, kind: "other", segments: 1 },
      { id: BAG_OUTER_EDGE_ID, kind: "other", segments: outerSegments, ...outerPair },
    ],
    ctx.options,
  );
  const notch = bagNotch(other);
  return {
    id,
    name: PIECE_NAMES[id]!,
    cut: { quantity: 2, onFold: false, mirror: true, fabric: "main" },
    stitchPath: path,
    edges,
    notches: [
      notch(POCKET_TOP_NOTCH_ID, POCKET_BAG_EXTENSION_MM),
      notch(POCKET_BOTTOM_NOTCH_ID, POCKET_BAG_EXTENSION_MM + POCKET_OPENING_MM),
    ],
    bodyLines: [],
    grainLine: [
      pt(POCKET_BAG_DEPTH_MM * BAG_GRAIN.widthShare, lengthMm * BAG_GRAIN.from),
      pt(POCKET_BAG_DEPTH_MM * BAG_GRAIN.widthShare, lengthMm * BAG_GRAIN.to),
    ],
    darts: [],
  };
}

/**
 * A notch on the shell side seam, a distance down from the top of the chain, paired with the back's side seam.
 *
 * @param chain - The front side chain.
 * @param id - Notch id.
 * @param fromTopMm - Distance from the top of the chain.
 * @returns The owning piece and the notch.
 */
function shellNotch(
  chain: readonly ChainLink[],
  id: string,
  fromTopMm: number,
): { piece: PieceDraft; notch: Notch } {
  const { link, downMm } = locateOnChain(chain, fromTopMm);
  const own = link.piece.edges.find((e) => e.id === link.edgeId)!;
  const partner = own.pairsWith ?? { pieceId: link.piece.id, edgeId: link.edgeId };
  const notch: Notch = {
    id,
    edgeId: link.edgeId,
    atMm: atFromEdgeStart(link, downMm),
    pairsWith: { pieceId: partner.pieceId, edgeId: partner.edgeId },
  };
  return { piece: link.piece, notch };
}

/**
 * Drafts the side-seam pockets.
 *
 * @param ctx - Context after the garment modules and the waistband.
 * @returns The context with the notches and the two bag pieces.
 * @throws {DraftingError} POCKET_NO_ROOM when the opening reaches below the hem; CLOSURE_TARGET_MISSING when the side
 *   seam cannot be found.
 */
export function draftSideSeamPockets(ctx: DraftContext): DraftContext {
  const chain = openingChain(ctx, "front", false);
  const topMm = waistDownMm(chain) + POCKET_OPENING_TOP_BELOW_WAIST_MM;
  const bottomMm = topMm + POCKET_OPENING_MM;
  const slitMm = ctx.spec.skirt?.slit?.position === "side" ? ctx.spec.skirt.slit.lengthMm : 0;
  const lengthMm = chainLengthMm(chain);
  if (
    bottomMm + POCKET_HEM_CLEARANCE_MM > lengthMm ||
    slitMm > lengthMm - bottomMm - POCKET_HEM_CLEARANCE_MM
  ) {
    throw new DraftingError(
      "POCKET_NO_ROOM",
      `The side pocket reaches ${bottomMm} mm of a ${lengthMm} mm side seam`,
    );
  }
  const notched = [
    shellNotch(chain, POCKET_TOP_NOTCH_ID, topMm),
    shellNotch(chain, POCKET_BOTTOM_NOTCH_ID, bottomMm),
  ];
  const shell = ctx.pieces.map((p) => {
    const mine = notched.filter((n) => n.piece.id === p.id).map((n) => n.notch);
    return mine.length > 0 ? { ...p, notches: [...p.notches, ...mine] } : p;
  });
  return withPieces(ctx, [...shell, ...BAG_IDS.map((id) => bagPiece(ctx, id))]);
}
