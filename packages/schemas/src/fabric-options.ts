/** Fabric choices for a yardage calculation, shared by the browser and the API (FR-FAB-01, decision 315). */
import { z } from "zod";
import { DEFAULT_FABRIC_WIDTH_MM, FABRIC_WIDTH_LIMITS_MM } from "./pattern-options";

/** The fabric widths offered as presets, in mm (90, 115, 140, 150 and 160 cm; FR-FAB-01). */
// eslint-disable-next-line no-magic-numbers -- the preset list is the data itself (FR-FAB-01)
export const FABRIC_WIDTH_PRESETS_MM = [900, 1150, 1400, 1500, 1600] as const;

/** Smallest and largest shrinkage the form accepts, in percent (decision 315). */
export const SHRINKAGE_LIMITS_PERCENT = { min: 0, max: 20 } as const;

/** Default shrinkage in percent (ADR-312 item 4). */
export const DEFAULT_SHRINKAGE_PERCENT = 5;

/** Smallest and largest pattern repeat the form accepts, in mm (0 to 1 m; decision 315). */
export const PATTERN_REPEAT_LIMITS_MM = { min: 0, max: 1000 } as const;

/** How the fabric lies on the table: folded in half lengthwise, or opened out in one layer. */
export const fabricLayoutSchema = z.enum(["folded", "open"]);

/** How the fabric lies on the table. */
export type FabricLayout = z.infer<typeof fabricLayoutSchema>;

/**
 * The fabric options of one calculation: width (a preset or any custom value inside the limits), layout, directional
 * nap, shrinkage and pattern repeat. Missing fields take their defaults.
 */
export const fabricOptionsSchema = z.object({
  widthMm: z
    .number()
    .min(FABRIC_WIDTH_LIMITS_MM.min)
    .max(FABRIC_WIDTH_LIMITS_MM.max)
    .default(DEFAULT_FABRIC_WIDTH_MM),
  layout: fabricLayoutSchema.default("folded"),
  directionalNap: z.boolean().default(false),
  shrinkagePercent: z
    .number()
    .min(SHRINKAGE_LIMITS_PERCENT.min)
    .max(SHRINKAGE_LIMITS_PERCENT.max)
    .default(DEFAULT_SHRINKAGE_PERCENT),
  patternRepeatMm: z
    .number()
    .min(PATTERN_REPEAT_LIMITS_MM.min)
    .max(PATTERN_REPEAT_LIMITS_MM.max)
    .default(PATTERN_REPEAT_LIMITS_MM.min),
});

/** The fabric options of one calculation, with every default filled. */
export type FabricOptions = z.infer<typeof fabricOptionsSchema>;

/** The options a new calculation starts from: 140 cm, folded, no nap, 5 % shrinkage, no repeat. */
export const DEFAULT_FABRIC_OPTIONS: FabricOptions = fabricOptionsSchema.parse({});
