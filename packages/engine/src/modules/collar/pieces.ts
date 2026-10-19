/**
 * What every collar piece shares (issue #141, decision 141): piece ids, how the opening sets the cut, the neck edge
 * split into `neck-back` and `neck-front` and paired with the bodice holders, the CB, shoulder and CF notches, and
 * the grain line parallel to the fold.
 */
import type { EngineOptions, Notch, Piece, Point, Segment } from "@tafsila/schemas";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import {
  COLLAR_GRAIN_FROM_END_MM,
  COLLAR_GRAIN_INSET_MM,
  COLLAR_GRAIN_MAX_INSET_SHARE,
} from "../../constants/collar";
import { add, distance, lerp, normalize, scale, sub } from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import { NECK_EDGE_ID, type NeckHalf, type NeckHolder } from "../../pieces/neck-seam";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Collar piece ids. */
export const COLLAR_PIECE_IDS = {
  upper: "collar-upper",
  under: "collar-under",
  interfacing: "collar-interfacing",
  stand: "collar-stand",
  standInterfacing: "collar-stand-interfacing",
} as const;

/** Collar edge ids. */
export const COLLAR_EDGE_IDS = {
  neckBack: "neck-back",
  neckFront: "neck-front",
  outer: "outer",
  top: "top",
  stand: "stand",
  extension: "extension",
  cb: "cb",
  cf: "cf",
} as const;

/** Where the collar opens: cut on the CB fold (open at CF), on the CF fold (open at CB), or a mirrored pair. */
export type CollarOpening = "cb-fold" | "cf-fold" | "pair";

/** The bodice neck a collar sews to. */
export type CollarHolders = Readonly<Record<NeckHalf, NeckHolder>>;

/** The neck edge of a collar, CB to CF, split at the shoulder. */
export interface CollarNeck {
  /** CB to shoulder: sews to the back holder's neck, same direction. */
  readonly back: readonly Segment[];
  /** Shoulder to CF: sews to the front holder's neck, which runs CF to neck point (reversed). */
  readonly front: readonly Segment[];
}

/**
 * Cut info of a collar piece.
 *
 * @param opening - Where the collar opens.
 * @param fabric - Main fabric or interfacing.
 * @param quantity - Copies per fold or per side (2 for a stand: outer and inner).
 * @returns The cut info.
 */
export function collarCut(
  opening: CollarOpening,
  fabric: Piece["cut"]["fabric"],
  quantity = 1,
): Piece["cut"] {
  return opening === "pair"
    ? { quantity: 2 * quantity, onFold: false, mirror: true, fabric }
    : { quantity, onFold: true, mirror: false, fabric };
}

/**
 * The two neck edges, paired with the bodice holders when `paired`.
 *
 * @param neck - The collar neck.
 * @param holders - The bodice neck holders.
 * @param paired - Whether the edges declare their pairs (false for an interfacing).
 * @returns Edge specs for `neck-back` then `neck-front`.
 */
export function neckEdgeSpecs(neck: CollarNeck, holders: CollarHolders, paired: boolean): EdgeSpec[] {
  return [
    {
      id: COLLAR_EDGE_IDS.neckBack,
      kind: "neckline",
      segments: neck.back.length,
      ...(paired ? { pairsWith: { pieceId: holders.back.piece.id, edgeId: NECK_EDGE_ID } } : {}),
    },
    {
      id: COLLAR_EDGE_IDS.neckFront,
      kind: "neckline",
      segments: neck.front.length,
      ...(paired
        ? { pairsWith: { pieceId: holders.front.piece.id, edgeId: NECK_EDGE_ID, reversed: true } }
        : {}),
    },
  ];
}

/**
 * The notches at CB, at each shoulder and at CF on the collar neck; the finishing step writes their partners on the
 * bodice necks (FR-VAL-04).
 *
 * @param holders - The bodice neck holders.
 * @returns The four notches.
 */
export function neckNotches(holders: CollarHolders): Notch[] {
  const back = { pieceId: holders.back.piece.id, edgeId: NECK_EDGE_ID };
  const front = { pieceId: holders.front.piece.id, edgeId: NECK_EDGE_ID, reversed: true };
  const { neckBack, neckFront } = COLLAR_EDGE_IDS;
  return [
    { id: "collar-cb", edgeId: neckBack, atMm: 0, pairsWith: back },
    { id: "collar-shoulder-back", edgeId: neckBack, atMm: holders.back.lengthMm, pairsWith: back },
    { id: "collar-shoulder-front", edgeId: neckFront, atMm: 0, pairsWith: front },
    { id: "collar-cf", edgeId: neckFront, atMm: holders.front.lengthMm, pairsWith: front },
  ];
}

/**
 * Grain line parallel to an end line (the fold, or the CB end of a pair), `COLLAR_GRAIN_FROM_END_MM` inside it.
 *
 * @param neckEnd - Where the end line meets the neck edge.
 * @param outerEnd - Where it meets the outer (or top) edge.
 * @param inward - Unit direction from the end line into the piece.
 * @returns The grain line ends.
 */
export function grainNearEnd(neckEnd: Point, outerEnd: Point, inward: Point): [Point, Point] {
  const shift = scale(normalize(inward), COLLAR_GRAIN_FROM_END_MM);
  const share = Math.min(COLLAR_GRAIN_INSET_MM / distance(neckEnd, outerEnd), COLLAR_GRAIN_MAX_INSET_SHARE);
  const start = add(neckEnd, shift);
  const end = add(outerEnd, shift);
  return [lerp(start, end, share), lerp(start, end, 1 - share)];
}

/** What a collar piece is made of. */
export interface CollarPieceSpec {
  /** Piece id (its name comes from the piece-name catalogue). */
  readonly id: string;
  /** Cut info. */
  readonly cut: Piece["cut"];
  /** Closed stitch outline. */
  readonly outline: readonly Segment[];
  /** Edge specs in path order. */
  readonly edges: readonly EdgeSpec[];
  /** Balance notches. */
  readonly notches: readonly Notch[];
  /** Grain line. */
  readonly grainLine: readonly [Point, Point];
}

/**
 * Builds one collar piece.
 *
 * @param spec - The piece.
 * @param options - Engine options, for the seam allowances.
 * @returns The piece, ready for the finishing step.
 */
export function collarPiece(
  spec: CollarPieceSpec,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  return {
    id: spec.id,
    name: PIECE_NAMES[spec.id]!,
    cut: spec.cut,
    stitchPath: [...spec.outline],
    edges: buildEdges(spec.id, spec.edges, options),
    notches: [...spec.notches],
    bodyLines: [],
    grainLine: [spec.grainLine[0], spec.grainLine[1]],
    darts: [],
  };
}

/**
 * The direction from one point to another.
 *
 * @param from - Start.
 * @param to - End.
 * @returns Unit vector.
 */
export function towards(from: Point, to: Point): Point {
  return normalize(sub(to, from));
}

/** The outer edge's partner: the other of the upper and under collar, with the turn-of-cloth difference. */
export interface OuterPair {
  /** The other piece. */
  readonly pieceId: string;
  /** This outer edge minus the partner's, in mm. */
  readonly intendedEaseMm: number;
}

/**
 * The outer edge, where the upper and under collar are sewn together.
 *
 * @param segments - Segments in the edge.
 * @param pair - The partner, or undefined for an interfacing.
 * @returns The edge spec.
 */
export function outerEdgeSpec(segments: number, pair: OuterPair | undefined): EdgeSpec {
  return {
    id: COLLAR_EDGE_IDS.outer,
    kind: "other",
    segments,
    ...(pair ? { pairsWith: { ...pair, edgeId: COLLAR_EDGE_IDS.outer } } : {}),
  };
}

/**
 * The upper and under pairs of two outlines whose outer edges differ by the turn of cloth.
 *
 * @param upperMm - Upper collar outer edge length.
 * @param underMm - Under collar outer edge length.
 * @returns The upper's pair and the under's pair.
 */
export function upperUnderPairs(upperMm: number, underMm: number): { upper: OuterPair; under: OuterPair } {
  const easeMm = upperMm - underMm;
  return {
    upper: { pieceId: COLLAR_PIECE_IDS.under, intendedEaseMm: easeMm },
    under: { pieceId: COLLAR_PIECE_IDS.upper, intendedEaseMm: -easeMm },
  };
}
