/** DesignSpec contract (SRS §6.1): the only thing AI produces; the engine draws from it (ADR-002). */
import { z } from "zod";

/** Garment categories supported in release 1. */
export const garmentCategorySchema = z.enum(["dress", "skirt", "blouse"]);

/** Bodice fit and shaping. */
const bodiceSchema = z.object({
  fit: z.enum(["fitted", "semi-fitted", "loose"]),
  shaping: z.enum(["darts", "princess-shoulder", "princess-armhole", "none"]),
  waistSeam: z.boolean(),
});

/** Neckline shapes and collar. */
const necklineSchema = z.object({
  front: z.enum(["round", "v", "square", "sweetheart", "boat", "high-round"]),
  back: z.enum(["round", "v", "square", "high-round"]),
  depthFrontMm: z.number().positive().optional(),
  collar: z.enum(["none", "peter-pan", "shirt", "mandarin"]),
});

/** Sleeve type, length and finish. */
const sleeveSchema = z.object({
  type: z.enum(["none", "set-in", "cap", "puff", "bishop", "flutter"]),
  length: z.enum(["cap", "short", "elbow", "three-quarter", "long"]),
  cuff: z.enum(["none", "band", "elastic"]),
});

/** Skirt type, length and optional slit. */
const skirtSchema = z.object({
  type: z.enum(["straight", "a-line", "circle-half", "circle-full", "gathered", "pleated", "tiered"]),
  length: z.enum(["mini", "knee", "midi", "ankle", "floor"]),
  lengthMm: z.number().positive().optional(),
  slit: z.object({ position: z.enum(["front", "back", "side"]), lengthMm: z.number().positive() }).optional(),
});

/** Complete description of a garment design, validated before the engine runs. */
export const designSpecSchema = z.object({
  schemaVersion: z.literal(1),
  category: garmentCategorySchema,
  fabricType: z.literal("woven"),
  bodice: bodiceSchema.optional(),
  neckline: necklineSchema.optional(),
  sleeve: sleeveSchema.optional(),
  skirt: skirtSchema.optional(),
  waistband: z.enum(["none", "straight", "contour", "elastic"]).optional(),
  closure: z.object({
    type: z.enum(["zip", "buttons", "none"]),
    position: z.enum(["center-back", "side", "center-front"]),
  }),
  pockets: z.array(z.enum(["side-seam", "patch"])),
  lining: z.boolean(),
  belt: z.enum(["none", "self-tie"]).optional(),
});

/** A validated garment design. */
export type DesignSpec = z.infer<typeof designSpecSchema>;
