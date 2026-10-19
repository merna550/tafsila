/** Design contract for /api/designs (SRS FR-DES-01..): a garment the tailor is working on, with its saved versions. */
import { z } from "zod";
import { designSpecSchema, garmentCategorySchema } from "./design-spec";
import { easeProfileSchema, measurementsSchema } from "./measurements";
import { pageOf, pageQuerySchema } from "./pagination";

/** Longest design title and search text accepted (matches the database check). */
const MAX_TITLE_LENGTH = 120;

/** A design title: trimmed, 1 to 120 characters. */
const titleSchema = z.string().trim().min(1).max(MAX_TITLE_LENGTH).meta({ example: "فستان 2026-10-19" });

/** Example ids and times shared by the response examples. */
const EXAMPLE_DESIGN_ID = "00000000-0000-4000-8000-0000000000d1";
const EXAMPLE_VERSION_ID = "00000000-0000-4000-8000-0000000000f2";
const EXAMPLE_TIME = "2026-10-19T10:00:00.000Z";

/** A design as the API returns it (photos and analysis arrive with M6). */
export const designSchema = z.object({
  id: z.uuid().meta({ example: EXAMPLE_DESIGN_ID }),
  category: garmentCategorySchema.meta({ example: "dress" }),
  title: titleSchema,
  currentVersionId: z
    .uuid()
    .nullable()
    .meta({ example: EXAMPLE_VERSION_ID, description: "Newest saved version; null before the first save" }),
  createdAt: z.iso.datetime().meta({ example: EXAMPLE_TIME }),
  updatedAt: z.iso.datetime().meta({ example: EXAMPLE_TIME }),
});

/** Parsed design. */
export type Design = z.infer<typeof designSchema>;

/** What the designs list shows about a design, computed by the API in one query. */
export const designSummarySchema = z.object({
  versionCount: z.number().int().min(0).meta({ example: 2 }),
  currentStatus: z
    .enum(["pass", "warn"])
    .nullable()
    .meta({ example: "pass", description: "Validation status of the current version; null without one" }),
  clientName: z.string().nullable().meta({
    example: "منى أحمد",
    description: "Client of the current version's measurement set; null when none or deleted",
  }),
});

/** Parsed design summary. */
export type DesignSummary = z.infer<typeof designSummarySchema>;

/** A design in the list. */
export const designListItemSchema = designSchema.extend({ summary: designSummarySchema });

/** Parsed list item. */
export type DesignListItem = z.infer<typeof designListItemSchema>;

/** One saved version with its stored inputs (never the regenerated pattern; see GET /api/versions/{id}). */
export const patternVersionSchema = z.object({
  id: z.uuid().meta({ example: EXAMPLE_VERSION_ID }),
  designId: z.uuid().meta({ example: EXAMPLE_DESIGN_ID }),
  versionNo: z.number().int().min(1).meta({ example: 2 }),
  spec: designSpecSchema.meta({
    example: {
      schemaVersion: 1,
      category: "dress",
      fabricType: "woven",
      bodice: { fit: "fitted", shaping: "darts", waistSeam: true },
      neckline: { front: "round", back: "round", collar: "none" },
      sleeve: { type: "set-in", length: "short", cuff: "none" },
      skirt: { type: "straight", length: "knee" },
      waistband: "none",
      closure: { type: "zip", position: "center-back" },
      pockets: [],
      lining: false,
      belt: "none",
    },
  }),
  measurementSetId: z
    .uuid()
    .nullable()
    .meta({ example: "00000000-0000-4000-8000-0000000000c1", description: "Null when the set was deleted" }),
  measurements: measurementsSchema.describe("Snapshot of the measurements used"),
  sizeLabel: z.string().nullable().meta({ example: "M" }),
  easeProfile: easeProfileSchema.meta({ example: "regular" }),
  options: z.record(z.string(), z.unknown()).meta({ example: { fabricWidthMm: 1400 } }),
  engineVersion: z.string().meta({ example: "0.16.0" }),
  validationStatus: z.enum(["pass", "warn"]).meta({ example: "pass" }),
  inputHash: z.string().meta({ example: "fnv1a64:31a4c82202f88eb1" }),
  createdBy: z.enum(["user", "chat"]).meta({ example: "user" }),
  createdAt: z.iso.datetime().meta({ example: EXAMPLE_TIME }),
});

/** Parsed pattern version. */
export type PatternVersion = z.infer<typeof patternVersionSchema>;

/** Body of POST /api/designs: the title is optional (the API names the design when it is missing). */
export const createDesignInputSchema = z.object({
  category: garmentCategorySchema.meta({ example: "dress" }),
  title: titleSchema.optional(),
});

/** Parsed create-design body. */
export type CreateDesignInput = z.infer<typeof createDesignInputSchema>;

/** Body of PATCH /api/designs/{id}: only the title changes. */
export const updateDesignInputSchema = z.object({ title: titleSchema });

/** Parsed update-design body. */
export type UpdateDesignInput = z.infer<typeof updateDesignInputSchema>;

/** Query of GET /api/designs. */
export const listDesignsQuerySchema = pageQuerySchema.extend({
  q: z
    .string()
    .trim()
    .max(MAX_TITLE_LENGTH)
    .optional()
    .meta({ example: "فستان", description: "Title search" }),
  clientId: z.uuid().optional().meta({
    example: "00000000-0000-4000-8000-0000000000a1",
    description: "Only designs with a version made for this client",
  }),
});

/** Parsed list-designs query. */
export type ListDesignsQuery = z.infer<typeof listDesignsQuerySchema>;

/** Response of GET /api/designs. */
export const designPageSchema = pageOf(designListItemSchema);

/** Response of GET /api/designs/{id}: the design and its current version's inputs. */
export const designDetailSchema = z.object({
  design: designSchema,
  currentVersion: patternVersionSchema.nullable(),
});

/** Parsed design detail. */
export type DesignDetail = z.infer<typeof designDetailSchema>;
