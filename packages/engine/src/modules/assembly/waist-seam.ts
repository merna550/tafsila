/**
 * Dress with a waist seam (issue #144, decision 144, 3): waist notches where the bodice and skirt darts meet, and the
 * rule that the bodice and skirt waists sew to the same length.
 */
import type { Notch, ValidationCheck } from "@tafsila/schemas";
import { ASSEMBLY_ORDER, WAIST_DART_NOTCH_ID, WAIST_SEAM_TOLERANCE_MM } from "../../constants/assembly";
import { segmentLength } from "../../geometry";
import { bodyLineMultiplier } from "../../pieces/body-lines";
import { closedWaistMm, WAIST_EDGE_ID, waistPieces } from "../../pieces/waist-seam";
import { isOnePieceDress } from "../../pipeline/category-rules";
import { type DraftContext, type PieceDraft, withPiece } from "../../pipeline/draft-context";
import type { FeatureModule, ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";

/** Front or back half of the garment. */
export type GarmentHalf = "front" | "back";

/** Both halves, front first. */
export const GARMENT_HALVES: readonly GarmentHalf[] = ["front", "back"];

/** Id of the waist dart on the bodice and the skirt blocks. */
const WAIST_DART_ID = "waist-dart";

/** Bilingual name of each half, for the messages. */
const HALF_NAMES: Readonly<Record<GarmentHalf, { readonly ar: string; readonly en: string }>> = {
  front: { ar: "الأمام", en: "front" },
  back: { ar: "الخلف", en: "back" },
};

/**
 * Whether a piece id belongs to a half (`bodice-front-side`, `skirt-back`, `tier-1-front`, `front-panel`).
 *
 * @param id - Piece id.
 * @param half - Front or back.
 * @returns True when the id names that half.
 */
function inHalf(id: string, half: GarmentHalf): boolean {
  return id.split("-").includes(half);
}

/**
 * The bodice pieces of one half that sew to the skirt: the block half or both princess panels.
 *
 * @param pieces - Pieces drafted so far.
 * @param half - Front or back.
 * @returns The pieces, in drafted order.
 */
export function bodiceWaistPieces(pieces: readonly PieceDraft[], half: GarmentHalf): PieceDraft[] {
  return waistPieces(pieces, "bodice").filter((p) => inHalf(p.id, half));
}

/**
 * The skirt pieces of one half that sew to the bodice.
 *
 * @param pieces - Pieces drafted so far.
 * @param half - Front or back.
 * @returns The pieces, in drafted order.
 */
export function skirtWaistPieces(pieces: readonly PieceDraft[], half: GarmentHalf): PieceDraft[] {
  return waistPieces(pieces).filter((p) => inHalf(p.id, half));
}

/**
 * Sewn waist of a set of pieces around the garment (darts closed, gathers drawn up, pleats folded), counting each
 * piece as many times as it is cut.
 *
 * @param pieces - The pieces.
 * @returns Length in mm.
 */
function sewnWaistMm(pieces: readonly PieceDraft[]): number {
  return pieces.reduce((sum, p) => sum + closedWaistMm(p) * bodyLineMultiplier(p), 0);
}

/**
 * The bodice waist and the skirt waist of one half, each around the garment.
 *
 * @param ctx - Finished context.
 * @param half - Front or back.
 * @returns Both lengths in mm.
 */
export function waistSeamMm(ctx: DraftContext, half: GarmentHalf): { bodiceMm: number; skirtMm: number } {
  return {
    bodiceMm: sewnWaistMm(bodiceWaistPieces(ctx.pieces, half)),
    skirtMm: sewnWaistMm(skirtWaistPieces(ctx.pieces, half)),
  };
}

/**
 * One FR-VAL-01 row per half: the bodice waist matches the skirt waist within 2 mm. Gathers and pleats count at the
 * length they are sewn to (their declared ease), so nothing is forced; a mismatch is reported, never fixed.
 *
 * @param ctx - Finished context.
 * @returns Two checks, front then back.
 */
function waistSeamChecks(ctx: DraftContext): readonly ValidationCheck[] {
  return GARMENT_HALVES.map((half) => {
    const { bodiceMm, skirtMm } = waistSeamMm(ctx, half);
    const measuredMm = Math.abs(bodiceMm - skirtMm);
    const passes = measuredMm <= WAIST_SEAM_TOLERANCE_MM;
    const code = passes ? "DRESS_WAIST_SEAM_OK" : "DRESS_WAIST_SEAM_LENGTH";
    const name = HALF_NAMES[half];
    const params = { mm: Math.round(bodiceMm), expected: Math.round(skirtMm) };
    const ar = formatMessage(code, { ...params, half: name.ar }).ar;
    const en = formatMessage(code, { ...params, half: name.en }).en;
    return {
      id: "FR-VAL-01",
      code,
      status: passes ? "pass" : "fail",
      message: { ar, en },
      measuredMm,
      expectedMm: 0,
      refs: [`${half}/waist`],
    };
  });
}

/** FR-VAL-01 for a dress with a waist seam: bodice and skirt waists sew to the same length, per half. */
export const dressWaistSeamRule: ValidationRule = {
  id: "FR-VAL-01",
  code: "DRESS_WAIST_SEAM_LENGTH",
  appliesTo: (ctx) => ctx.spec.category === "dress" && !isOnePieceDress(ctx.spec),
  run: (ctx) => waistSeamChecks(ctx)[0]!,
  runMany: waistSeamChecks,
};

/**
 * One waist dart notch, paired with the other side of the seam (the waist edges run in opposite directions).
 *
 * @param half - Front (one tick) or back (two ticks, decision 131).
 * @param atMm - Distance from the edge start.
 * @param pieceId - The piece on the other side of the seam.
 * @returns The notch.
 */
function waistNotch(half: GarmentHalf, atMm: number, pieceId: string): Notch {
  return {
    id: WAIST_DART_NOTCH_ID,
    edgeId: WAIST_EDGE_ID,
    atMm,
    ...(half === "back" ? { marks: 2 as const } : {}),
    pairsWith: { pieceId, edgeId: WAIST_EDGE_ID, reversed: true },
  };
}

/**
 * Adds the paired waist notch where the bodice dart closes, on the bodice and on the skirt dart under it. Only for a
 * darted bodice over a darted skirt half in one piece; other skirts have no dart to meet (decision 144, 3).
 *
 * @param ctx - Current context.
 * @param half - Front or back.
 * @returns The context with both notches, or unchanged.
 */
function withWaistNotches(ctx: DraftContext, half: GarmentHalf): DraftContext {
  const bodice = ctx.pieces.find((p) => p.id === `bodice-${half}`);
  const skirt = ctx.pieces.find((p) => p.id === `skirt-${half}`);
  const bodiceDart = bodice?.darts.find((d) => d.id === WAIST_DART_ID);
  const skirtDart = skirt?.darts.find((d) => d.id === WAIST_DART_ID);
  const bodiceWaist = bodice?.edges.find((e) => e.id === WAIST_EDGE_ID);
  if (!bodice || !skirt || !bodiceDart || !skirtDart || !bodiceWaist) return ctx;
  const sideToDartMm = segmentLength(bodice.stitchPath[bodiceWaist.fromSegment]!);
  const centreToDartMm = Math.hypot(skirtDart.legs[0].x, skirtDart.legs[0].y);
  const withBodice = withPiece(ctx, {
    ...bodice,
    notches: [...bodice.notches, waistNotch(half, sideToDartMm, skirt.id)],
  });
  return withPiece(withBodice, {
    ...skirt,
    notches: [...skirt.notches, waistNotch(half, centreToDartMm, bodice.id)],
  });
}

/**
 * The waist seam of a dress: notches where the darts meet, and the waist seam length rule. Changes no geometry.
 */
export const dressWaistSeamModule: FeatureModule = {
  id: "assembly-waist-seam",
  order: ASSEMBLY_ORDER,
  appliesTo: (spec) => spec.category === "dress" && !isOnePieceDress(spec),
  draft: (ctx) => GARMENT_HALVES.reduce(withWaistNotches, ctx),
  validations: [dressWaistSeamRule],
};
