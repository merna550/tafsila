/** Fabric catalogue and recommendation rule contracts (SRS FR-REC-01, FR-REC-02; ADR-314). */
import { z } from "zod";

/** Named steps of the fixed 0 to 4 fabric property scale (0 = lowest, 4 = highest; ADR-314). */
export const FABRIC_LEVEL = { none: 0, low: 1, mid: 2, high: 3, max: 4 } as const;

/** Named rule priorities, 1 (minor) to 5 (decisive). */
export const RULE_PRIORITY = { minor: 1, low: 2, medium: 3, high: 4, decisive: 5 } as const;

/** Fewest and most fabrics a recommendation returns (FR-REC-02). */
export const RECOMMENDED_COUNT = { min: 3, max: 5 } as const;

/** A fabric property on the fixed 0 to 4 scale. */
const propertyLevelSchema = z.number().int().min(FABRIC_LEVEL.none).max(FABRIC_LEVEL.max);

/** The five fabric properties a rule can ask for. */
export const fabricPropertyNameSchema = z.enum(["drape", "weight", "body", "stretch", "sheen"]);

/** Name of a fabric property. */
export type FabricPropertyName = z.infer<typeof fabricPropertyNameSchema>;

/** Text in both interface languages (NFR-06). */
export const bilingualTextSchema = z.object({ ar: z.string().min(1), en: z.string().min(1) });

/** Arabic and English text. */
export type BilingualText = z.infer<typeof bilingualTextSchema>;

/** Physical properties of a fabric. Stretch is 0 for every woven fabric in v1. */
export const fabricPropertiesSchema = z.object({
  drape: propertyLevelSchema,
  weight: propertyLevelSchema,
  body: propertyLevelSchema,
  stretch: propertyLevelSchema,
  sheen: propertyLevelSchema,
});

/** The five fabric properties as numbers 0 to 4. */
export type FabricProperties = z.infer<typeof fabricPropertiesSchema>;

/** One fabric of the catalogue, with its Egyptian market name. */
export const fabricSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case slug"),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  properties: fabricPropertiesSchema,
  careNotes: bilingualTextSchema,
});

/** A catalogue fabric. */
export type Fabric = z.infer<typeof fabricSchema>;

/** One test over a DesignSpec feature path, such as `skirt.type in [circle-half]`. */
export const ruleConditionSchema = z.object({
  path: z.string().min(1),
  op: z.enum(["in", "not-in", "is-true"]),
  values: z.array(z.string().min(1)).optional(),
});

/** A rule condition. */
export type RuleCondition = z.infer<typeof ruleConditionSchema>;

/** What a rule asks of a fabric property: a range, and whether breaking it only costs score or excludes the fabric. */
export const ruleEffectSchema = z
  .object({
    property: fabricPropertyNameSchema,
    min: propertyLevelSchema.optional(),
    max: propertyLevelSchema.optional(),
    strength: z.enum(["prefer", "must"]),
  })
  .refine((e) => e.min !== undefined || e.max !== undefined, { message: "An effect needs a min or a max" })
  .refine((e) => e.min === undefined || e.max === undefined || e.min <= e.max, {
    message: "min must not exceed max",
  });

/** A rule effect. */
export type RuleEffect = z.infer<typeof ruleEffectSchema>;

/** A recommendation rule: when every condition holds, the effect applies with the given priority. */
export const fabricRuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case slug"),
  when: z.array(ruleConditionSchema).min(1),
  effect: ruleEffectSchema,
  priority: z.number().int().min(RULE_PRIORITY.minor).max(RULE_PRIORITY.decisive),
  reason: bilingualTextSchema,
});

/** A recommendation rule. */
export type FabricRule = z.infer<typeof fabricRuleSchema>;

/** A fabric chosen for a design, with its score and one-line reason. */
export const fabricRecommendationSchema = z.object({
  fabricId: z.string().min(1),
  score: z.number(),
  reason: bilingualTextSchema,
});

/** A recommended fabric. */
export type FabricRecommendation = z.infer<typeof fabricRecommendationSchema>;

/** A fabric to avoid for a design, with the rule that excludes it. */
export const fabricAvoidSchema = z.object({
  fabricId: z.string().min(1),
  ruleId: z.string().min(1),
  reason: bilingualTextSchema,
});

/** A fabric on the avoid list. */
export type FabricAvoid = z.infer<typeof fabricAvoidSchema>;

/** Result of a recommendation: 3 to 5 fabrics and the avoid list (FR-REC-02). */
export const fabricRecommendationResultSchema = z.object({
  recommended: z.array(fabricRecommendationSchema).min(RECOMMENDED_COUNT.min).max(RECOMMENDED_COUNT.max),
  avoid: z.array(fabricAvoidSchema),
});

/** Recommendation result. */
export type FabricRecommendationResult = z.infer<typeof fabricRecommendationResultSchema>;
