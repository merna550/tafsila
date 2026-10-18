/**
 * Constants of the half- and full-circle skirts (issue #136, decision 136-circle-skirts). Method:
 * `docs/engine/drafting-method.md`, "Circle skirts" (Aldrich, Metric Pattern Cutting for Women's Wear, Chapter 3,
 * "Flared and circular skirts").
 */
import type { Piece } from "@tafsila/schemas";

/** A text in Arabic and English. */
type LocalizedText = Piece["name"];

/** The circle skirt types of the DesignSpec. */
export type CircleSkirtType = "circle-half" | "circle-full";

/**
 * Angle the whole assembled skirt covers, in radians: half a circle (π) or a full circle (2π). The waist radius is
 * derived from it so the assembled waist arc equals waist + ease, whatever the piece count (decision 136, 1).
 */
export const CIRCLE_SKIRT_SWEEP_RAD: Readonly<Record<CircleSkirtType, number>> = {
  "circle-half": Math.PI,
  "circle-full": Math.PI * 2,
};

/**
 * How many copies of the drafted piece make the whole skirt: front and back, each cut on the fold or as a
 * mirrored pair. Every drafted piece is one quarter of the skirt, from the centre line to the side seam.
 */
export const CIRCLE_SKIRT_COPIES = 4;

/** The waist radius is corrected until the drafted waist arc is within this of its target, in mm. */
export const CIRCLE_WAIST_TOLERANCE_MM = 0.01;

/** Most waist-radius corrections; one step already reaches 1e-6 of the arc, so 5 is a wide margin. */
export const CIRCLE_WAIST_MAX_STEPS = 5;

/** Length of the grain line as a share of the skirt length (centred in the piece, clear of waist and hem). */
export const CIRCLE_GRAIN_LINE_SHARE = 0.5;

/**
 * Hours to let a circle skirt hang before the hem is levelled. The bias parts of the hem drop by up to a few
 * centimetres in woven fabric; hanging it a day first is the standard instruction (Aldrich, Chapter 3).
 */
export const CIRCLE_SKIRT_HANG_HOURS = 24;

/** Sewing-order note for every circle skirt: hang, then level the hem (the sewing order step, #146, prints it). */
export const CIRCLE_SKIRT_HEM_LEVELLING_NOTE: LocalizedText = {
  ar: `علّقي التنورة ${CIRCLE_SKIRT_HANG_HOURS} ساعة قبل تقفيل الذيل: الأجزاء المقصوصة على الوَرْب تنزل. بعدها قيسي الطول من الأرض وسوّي الذيل.`,
  en: `Hang the skirt for ${CIRCLE_SKIRT_HANG_HOURS} hours before hemming: the bias parts drop. Then measure the length from the floor and level the hem.`,
};
