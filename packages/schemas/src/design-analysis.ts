/** What AI photo analysis returns (issue #337, FR-DES-03, FR-DES-07): a DesignSpec plus how sure the model is. */
import { z } from "zod";
import { designSpecSchema, garmentCategorySchema } from "./design-spec";
import { bilingualTextSchema } from "./fabric";

/**
 * Every feature of a design, parents first. The engine's picker, `normalizeSpec` and the AI confidence map all use
 * this one list; a test checks it against `designSpecSchema`.
 */
export const DESIGN_FEATURE_PATHS = [
  "category",
  "bodice.shaping",
  "bodice.fit",
  "bodice.waistSeam",
  "skirt.type",
  "skirt.length",
  "skirt.slit",
  "waistband",
  "neckline.front",
  "neckline.back",
  "neckline.collar",
  "sleeve.type",
  "sleeve.length",
  "sleeve.cuff",
  "closure.type",
  "closure.position",
  "pockets",
  "belt",
  "lining",
] as const;

/** One feature of a design, such as `"skirt.type"`. */
export const designFeaturePathSchema = z.enum(DESIGN_FEATURE_PATHS);

/** One feature of a design, such as `"skirt.type"`. */
export type DesignFeaturePath = z.infer<typeof designFeaturePathSchema>;

/** The optional lengths of a design, in mm, that a user or the AI may set. */
export const DESIGN_LENGTH_PATHS = [
  "neckline.depthFrontMm",
  "skirt.lengthMm",
  "skirt.slit.lengthMm",
] as const;

/** One length of a design, such as `"skirt.lengthMm"`. */
export const designLengthPathSchema = z.enum(DESIGN_LENGTH_PATHS);

/** One length of a design, such as `"skirt.lengthMm"`. */
export type DesignLengthPath = z.infer<typeof designLengthPathSchema>;

/** How sure the model is about one feature: 0 is a guess, 1 is certain. */
export const confidenceSchema = z.number().min(0).max(1);

/** A note about one feature the model is unsure of (FR-DES-07). */
export const analysisNoteSchema = z.object({ path: designFeaturePathSchema, text: bilingualTextSchema });

/** A note about one feature the model is unsure of (FR-DES-07). */
export type AnalysisNote = z.infer<typeof analysisNoteSchema>;

/** The result of analysing garment photos: the design, per-feature confidence, notes and unsupported features. */
export const designAnalysisResultSchema = z.object({
  spec: designSpecSchema,
  category: z.object({ value: garmentCategorySchema, confidence: confidenceSchema }),
  confidence: z.partialRecord(designFeaturePathSchema, confidenceSchema),
  notes: z.array(analysisNoteSchema),
  unsupported: z.array(z.object({ text: bilingualTextSchema })),
});

/** The result of analysing garment photos. */
export type DesignAnalysisResult = z.infer<typeof designAnalysisResultSchema>;
