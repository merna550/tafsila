/** Shared helpers of the sleeve style and cuff tests (issue #142). */
import type { DesignSpec, Measurements, PatternResult, Piece } from "@tafsila/schemas";
import { dartedBlouse, sizeM } from "@tafsila/test-fixtures";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

/** The sleeve of a design. */
export type Sleeve = NonNullable<DesignSpec["sleeve"]>;

/**
 * The seed blouse with a sleeve.
 *
 * @param sleeve - Type, length and cuff.
 * @returns The design.
 */
export function sleeveDesign(sleeve: Sleeve): DesignSpec {
  return { ...dartedBlouse, sleeve };
}

/**
 * Drafts the seed blouse with a sleeve.
 *
 * @param type - Sleeve type.
 * @param length - Sleeve length.
 * @param cuff - Cuff.
 * @param m - Measurements, size M by default.
 * @returns The pattern.
 */
export function draftSleeveDesign(
  type: Sleeve["type"],
  length: Sleeve["length"],
  cuff: Sleeve["cuff"],
  m: Measurements = sizeM,
): PatternResult {
  return generatePattern(sleeveDesign({ type, length, cuff }), m, DEFAULT_ENGINE_OPTIONS);
}

/**
 * A piece of a pattern by id.
 *
 * @param r - The pattern.
 * @param id - Piece id.
 * @returns The piece (the test fails on a missing piece).
 */
export function pieceOf(r: PatternResult, id: string): Piece {
  const piece = r.pieces.find((p) => p.id === id);
  if (!piece) throw new Error(`No piece ${id}`);
  return piece;
}
