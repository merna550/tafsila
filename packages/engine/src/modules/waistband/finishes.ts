/**
 * The four waist finishes (issue #140, FR-PAT-05, decision 140): straight band, contour band, elastic casing and,
 * for `none`, a waist facing. Each returns the pieces it adds; the module picks one from the design.
 */
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import {
  CASING_EASE_MM,
  CLOSURE_OVERLAP_MM,
  CONTOUR_BAND_WIDTH_MM,
  ELASTIC_WIDTH_MM,
  STRAIGHT_BAND_WIDTH_MM,
  WAIST_FACING_DEPTH_MM,
} from "../../constants/waistband";
import { waistPieces } from "../../pieces/waist-seam";
import { waistRuns } from "./runs";
import { stripPiece } from "./strip";
import { tracedPiece } from "./traced";

/** Layers of a band folded along its length: the cut piece is twice the finished width. */
const FOLDED_LAYERS = 2;

/** Piece ids of the finishes. */
export const WAISTBAND_PIECE_IDS = {
  band: "waistband",
  bandInterfacing: "waistband-interfacing",
  casing: "waistband-casing",
  flatFacing: "waist-facing",
  flatFacingInterfacing: "waist-facing-interfacing",
} as const;

/**
 * Underlap the closure needs past the band's end: none when nothing opens.
 *
 * @param ctx - Current context.
 * @returns Underlap in mm.
 */
export function closureOverlapMm(ctx: DraftContext): number {
  return ctx.spec.closure.type === "none" ? 0 : CLOSURE_OVERLAP_MM;
}

/**
 * Straight band: a rectangle as long as the sewn skirt waist plus the closure underlap, cut twice the finished width
 * and folded, with an interfacing for the outer half (Aldrich, straight waistband).
 *
 * @param ctx - Context with the skirt drafted.
 * @returns The band and its interfacing.
 */
export function straightBand(ctx: DraftContext): PieceDraft[] {
  const runs = waistRuns(ctx.pieces, ctx.spec.closure.position, "sewn");
  const overlapMm = closureOverlapMm(ctx);
  const loop = overlapMm === 0;
  return [
    stripPiece(
      {
        id: WAISTBAND_PIECE_IDS.band,
        runs,
        heightMm: FOLDED_LAYERS * STRAIGHT_BAND_WIDTH_MM,
        overlapMm,
        loop,
        fabric: "main",
        paired: true,
      },
      ctx.options,
    ),
    stripPiece(
      {
        id: WAISTBAND_PIECE_IDS.bandInterfacing,
        runs,
        heightMm: STRAIGHT_BAND_WIDTH_MM,
        overlapMm,
        loop,
        fabric: "interfacing",
        paired: false,
      },
      ctx.options,
    ),
  ];
}

/**
 * Elastic casing: a folded strip as long as the relaxed skirt waist (gathers let out, the elastic draws them up),
 * wide enough for the elastic to slide; always a loop, as an elastic waist needs no opening (decision 140, 3).
 *
 * @param ctx - Context with the skirt drafted.
 * @returns The casing.
 */
export function elasticCasing(ctx: DraftContext): PieceDraft[] {
  return [
    stripPiece(
      {
        id: WAISTBAND_PIECE_IDS.casing,
        runs: waistRuns(ctx.pieces, ctx.spec.closure.position, "relaxed"),
        heightMm: FOLDED_LAYERS * (ELASTIC_WIDTH_MM + CASING_EASE_MM),
        overlapMm: 0,
        loop: true,
        fabric: "main",
        paired: true,
      },
      ctx.options,
    ),
  ];
}

/**
 * Flat waist facing for a gathered, pleated or tiered skirt, whose top is straight: a strip as long as the sewn
 * waist, with its interfacing; a loop only when nothing opens.
 *
 * @param ctx - Context with the skirt drafted.
 * @returns The facing and its interfacing.
 */
export function flatFacing(ctx: DraftContext): PieceDraft[] {
  const runs = waistRuns(ctx.pieces, ctx.spec.closure.position, "sewn");
  const loop = ctx.spec.closure.type === "none";
  /**
   * One facing strip.
   *
   * @param id - Piece id.
   * @param fabric - Main fabric or interfacing.
   * @param paired - Whether its edges declare their pairs.
   * @returns The strip.
   */
  const strip = (id: string, fabric: "main" | "interfacing", paired: boolean): PieceDraft =>
    stripPiece(
      { id, runs, heightMm: WAIST_FACING_DEPTH_MM, overlapMm: 0, loop, fabric, paired },
      ctx.options,
    );
  return [
    strip(WAISTBAND_PIECE_IDS.flatFacing, "main", true),
    strip(WAISTBAND_PIECE_IDS.flatFacingInterfacing, "interfacing", false),
  ];
}

/**
 * Front or back, from a skirt piece id.
 *
 * @param pieceId - Skirt piece id such as `skirt-front`.
 * @returns The half.
 */
function halfOf(pieceId: string): "front" | "back" {
  return pieceId.endsWith("-back") ? "back" : "front";
}

/**
 * Contour band traced from a shaped skirt: per half a band rising `CONTOUR_BAND_WIDTH_MM` above the waist seam, a
 * band facing sewn to it along the top, and an interfacing (Aldrich, shaped waistband).
 *
 * @param ctx - Context with a shaped skirt drafted.
 * @returns Band, facing and interfacing for the front and the back.
 */
export function contourBand(ctx: DraftContext): PieceDraft[] {
  return waistPieces(ctx.pieces).flatMap((skirt) => {
    const half = halfOf(skirt.id);
    const band = `waistband-${half}`;
    const facing = `waistband-facing-${half}`;
    const base = { skirt, depthMm: CONTOUR_BAND_WIDTH_MM, side: "above" as const };
    return [
      tracedPiece({ ...base, id: band, fabric: "main", pairWaist: true, freePartnerId: facing }, ctx.options),
      tracedPiece(
        { ...base, id: facing, fabric: "main", pairWaist: false, freePartnerId: band },
        ctx.options,
      ),
      tracedPiece(
        { ...base, id: `waistband-interfacing-${half}`, fabric: "interfacing", pairWaist: false },
        ctx.options,
      ),
    ];
  });
}

/**
 * Waist facing traced from a shaped skirt when there is no band: per half a facing `WAIST_FACING_DEPTH_MM` deep
 * below the waist seam and its interfacing (Aldrich, waist facings).
 *
 * @param ctx - Context with a shaped skirt drafted.
 * @returns Facing and interfacing for the front and the back.
 */
export function tracedFacing(ctx: DraftContext): PieceDraft[] {
  return waistPieces(ctx.pieces).flatMap((skirt) => {
    const half = halfOf(skirt.id);
    const base = { skirt, depthMm: WAIST_FACING_DEPTH_MM, side: "below" as const };
    return [
      tracedPiece({ ...base, id: `waist-facing-${half}`, fabric: "main", pairWaist: true }, ctx.options),
      tracedPiece(
        { ...base, id: `waist-facing-interfacing-${half}`, fabric: "interfacing", pairWaist: false },
        ctx.options,
      ),
    ];
  });
}
