/** Pattern version contract for /api/designs/{id}/versions and /api/versions/{id} (SRS FR-PAT-01, FR-CHAT-05). */
import { z } from "zod";
import { designSpecSchema } from "./design-spec";
import { patternVersionSchema } from "./designs";
import { engineOptionsSchema } from "./engine-options";
import { easeProfileSchema } from "./measurements";
import { pageOf, pageQuerySchema } from "./pagination";
import { patternResultSchema, validationReportSchema } from "./pattern";

/** Body of POST /api/designs/{id}/versions: the server re-runs the engine, so only inputs are sent. */
export const savePatternVersionInputSchema = z.object({
  spec: designSpecSchema,
  measurementSetId: z
    .uuid()
    .meta({ example: "00000000-0000-4000-8000-0000000000c1", description: "A set the caller owns" }),
  easeProfile: easeProfileSchema.meta({ example: "regular" }),
  options: engineOptionsSchema
    .pick({ seamAllowance: true, fabricWidthMm: true })
    .meta({ example: { fabricWidthMm: 1400 } }),
});

/** Parsed save-version body. */
export type SavePatternVersionInput = z.infer<typeof savePatternVersionInputSchema>;

/** Query of GET /api/designs/{id}/versions. */
export const listPatternVersionsQuerySchema = pageQuerySchema;

/** Parsed list-versions query. */
export type ListPatternVersionsQuery = z.infer<typeof listPatternVersionsQuerySchema>;

/** One row of the version list: the metadata only, never the spec or the measurements. */
export const patternVersionListItemSchema = patternVersionSchema
  .pick({
    id: true,
    versionNo: true,
    validationStatus: true,
    engineVersion: true,
    sizeLabel: true,
    easeProfile: true,
    measurementSetId: true,
    createdBy: true,
    createdAt: true,
  })
  .extend({ isCurrent: z.boolean().meta({ example: true }) });

/** Parsed version list item. */
export type PatternVersionListItem = z.infer<typeof patternVersionListItemSchema>;

/** Response of GET /api/designs/{id}/versions. */
export const patternVersionPageSchema = pageOf(patternVersionListItemSchema);

/** Response of POST /api/designs/{id}/versions and POST /api/versions/{id}/restore. */
export const savePatternVersionResultSchema = z.object({
  version: patternVersionSchema,
  report: validationReportSchema,
  reused: z.boolean().meta({ description: "True when the current version already had these inputs" }),
});

/** Parsed save result. */
export type SavePatternVersionResult = z.infer<typeof savePatternVersionResultSchema>;

/** Response of GET /api/versions/{id}: the stored inputs and the pattern regenerated from them. */
export const patternVersionDetailSchema = z.object({
  version: patternVersionSchema,
  pattern: patternResultSchema,
  engineChanged: z
    .boolean()
    .meta({ description: "True when the version was saved by another engine version than the running one" }),
});

/** Parsed version detail. */
export type PatternVersionDetail = z.infer<typeof patternVersionDetailSchema>;
