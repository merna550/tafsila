/**
 * The length a sleeve hem is gathered to by its cuff (issue #142, decision 142, 5 and 6): a band cuff sits on the arm
 * with ease; an elastic cuff draws the hem up to about the arm girth.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { CUFF_BAND_EASE_MM } from "../../constants/cuff";

/** A cuff the design asks for. */
export type SleeveCuff = NonNullable<DesignSpec["sleeve"]>["cuff"];

/**
 * The length the sleeve hem is brought to by its cuff.
 *
 * @param cuff - The cuff (not `none`).
 * @param limbMm - Arm girth where the sleeve ends.
 * @returns The band's sewn edge, or the arm girth for elastic.
 */
export function cuffSeamMm(cuff: SleeveCuff, limbMm: number): number {
  return cuff === "band" ? limbMm + CUFF_BAND_EASE_MM : limbMm;
}

/**
 * Whether a band cuff opens (three-quarter and long sleeves: the hand must pass), or is a closed loop.
 *
 * @param length - Sleeve length.
 * @returns True for an open wrist cuff.
 */
export function cuffOpens(length: NonNullable<DesignSpec["sleeve"]>["length"]): boolean {
  return length === "three-quarter" || length === "long";
}
