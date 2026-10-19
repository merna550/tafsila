/**
 * Cuff pieces (issue #142, decision 142, 5 and 6). Aldrich 6th ed., ch. 2 (cuffs and openings): a band cuff folded in
 * two along its length with an interfacing, open with an overlap and a bound slit at the wrist, a loop above the elbow;
 * an elastic cuff as a folded casing as long as the relaxed hem.
 */
import type { EngineOptions, Mark } from "@tafsila/schemas";
import { SLEEVE_EDGE, SLEEVE_PIECE_ID } from "../../blocks/sleeve/ids";
import { CASING_EASE_MM } from "../../constants/elastic";
import {
  CUFF_BAND_WIDTH_MM,
  CUFF_ELASTIC_WIDTH_MM,
  CUFF_OVERLAP_MM,
  CUFF_PLACKET_WIDTH_MM,
  CUFF_SLIT_LENGTH_MM,
} from "../../constants/cuff";
import { pt, type Segment } from "../../geometry";
import { stripPiece } from "../../pieces/strip";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Piece ids of the cuffs. */
export const CUFF_PIECE_IDS = {
  band: "cuff",
  interfacing: "cuff-interfacing",
  placket: "cuff-placket",
  casing: "sleeve-casing",
} as const;

/** Layers of a strip folded along its length, and of a slit binding (both sides of the slit). */
const FOLDED_LAYERS = 2;

/** One cuff per sleeve. */
const PAIR = 2;

/** What the cuff pieces are drafted from. */
export interface CuffInput {
  /** Sewn length of the sleeve hem. */
  readonly hemMm: number;
  /** Sewn edge of the cuff (the band) or of the casing. */
  readonly seamMm: number;
  /** Whether the band opens at the wrist. */
  readonly opens: boolean;
}

/**
 * The band cuff, its interfacing and, when it opens, the slit binding strip.
 *
 * @param input - Hem, cuff seam and opening.
 * @param options - Engine options, for the seam allowances.
 * @returns The pieces.
 */
export function bandCuffPieces(
  input: CuffInput,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft[] {
  const widthMm = input.opens ? CUFF_BAND_WIDTH_MM.wrist : CUFF_BAND_WIDTH_MM.arm;
  const overlapMm = input.opens ? CUFF_OVERLAP_MM : 0;
  const pairsWith = {
    pieceId: SLEEVE_PIECE_ID,
    edgeId: SLEEVE_EDGE.hem,
    intendedEaseMm: input.seamMm - input.hemMm,
  };
  const base = {
    runs: [{ lengthMm: input.seamMm, pairsWith }],
    overlapMm,
    loop: !input.opens,
    quantity: PAIR,
  };
  const band = stripPiece(
    { ...base, id: CUFF_PIECE_IDS.band, heightMm: FOLDED_LAYERS * widthMm, fabric: "main", paired: true },
    options,
  );
  const interfacing = stripPiece(
    { ...base, id: CUFF_PIECE_IDS.interfacing, heightMm: widthMm, fabric: "interfacing", paired: false },
    options,
  );
  if (!input.opens) return [band, interfacing];
  const placket = stripPiece(
    {
      id: CUFF_PIECE_IDS.placket,
      runs: [{ lengthMm: FOLDED_LAYERS * CUFF_SLIT_LENGTH_MM }],
      heightMm: CUFF_PLACKET_WIDTH_MM,
      overlapMm: 0,
      loop: false,
      fabric: "main",
      paired: false,
      quantity: PAIR,
    },
    options,
  );
  return [band, interfacing, placket];
}

/**
 * The elastic casing: a folded loop as long as the relaxed hem, wide enough for the elastic to slide.
 *
 * @param input - Hem and casing seam (equal).
 * @param options - Engine options, for the seam allowances.
 * @returns The casing.
 */
export function elasticCasingPieces(
  input: CuffInput,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft[] {
  const pairsWith = {
    pieceId: SLEEVE_PIECE_ID,
    edgeId: SLEEVE_EDGE.hem,
    intendedEaseMm: input.seamMm - input.hemMm,
  };
  return [
    stripPiece(
      {
        id: CUFF_PIECE_IDS.casing,
        runs: [{ lengthMm: input.seamMm, pairsWith }],
        heightMm: FOLDED_LAYERS * (CUFF_ELASTIC_WIDTH_MM + CASING_EASE_MM),
        overlapMm: 0,
        loop: true,
        fabric: "main",
        paired: true,
        quantity: PAIR,
      },
      options,
    ),
  ];
}

/**
 * The slit of an open wrist cuff: a line up from the hem, halfway along the back half (Aldrich: the opening sits in
 * line with the little finger).
 *
 * @param hem - The sleeve hem line (front to back).
 * @returns The slit mark.
 */
export function cuffSlitMark(hem: Segment): Mark {
  const xMm = -Math.abs(hem.from.x) / 2;
  const yMm = hem.from.y;
  const mm = CUFF_SLIT_LENGTH_MM;
  return {
    id: "cuff-slit",
    kind: "slit",
    shape: "line",
    edgeId: SLEEVE_EDGE.hem,
    from: pt(xMm, yMm),
    to: pt(xMm, yMm - mm),
    text: { ar: `شق ${mm} مم`, en: `Slit ${mm} mm` },
  };
}
