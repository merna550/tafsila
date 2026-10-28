/** Admin contracts for /api/admin/fabrics and /api/admin/fabric-rules (FR-REC-03, FR-ADM-02; decision 317). */
import { z } from "zod";
import { fabricRuleSchema, fabricSchema } from "./fabric";

/** The editable fields of a fabric (everything except the id). */
const fabricFields = fabricSchema.omit({ id: true });

/** The editable fields of a rule (everything except the id). */
const ruleFields = fabricRuleSchema.omit({ id: true });

/** Message of the refinement that rejects an empty PATCH body. */
const EMPTY_PATCH = "Send at least one field to change";

/** Body of POST /api/admin/fabrics. A fabric an admin adds is reviewed by definition, so `isDraft` defaults to false. */
export const createFabricInputSchema = fabricSchema.extend({ isDraft: z.boolean().default(false) });

/** Parsed create-fabric body. */
export type CreateFabricInput = z.infer<typeof createFabricInputSchema>;

/** Body of PATCH /api/admin/fabrics/{id}: any editable field; `properties` and `careNotes` are replaced whole. */
export const updateFabricInputSchema = fabricFields
  .extend({ isDraft: z.boolean() })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: EMPTY_PATCH });

/** Parsed update-fabric body. */
export type UpdateFabricInput = z.infer<typeof updateFabricInputSchema>;

/** A catalogue fabric as the admin sees it, with its review flag and edit trail. */
export const adminFabricSchema = fabricSchema.extend({
  isDraft: z.boolean(),
  updatedAt: z.iso.datetime().meta({ example: "2026-10-28T10:00:00.000Z" }),
  updatedBy: z
    .uuid()
    .nullable()
    .meta({ description: "The admin who saved it last; null for the seeded row" }),
});

/** A parsed admin fabric. */
export type AdminFabric = z.infer<typeof adminFabricSchema>;

/** Response of GET /api/admin/fabrics. */
export const adminFabricListSchema = z.object({ items: z.array(adminFabricSchema) });

/** Body of POST /api/admin/fabric-rules. */
export const createFabricRuleInputSchema = fabricRuleSchema.extend({ isDraft: z.boolean().default(false) });

/** Parsed create-rule body. */
export type CreateFabricRuleInput = z.infer<typeof createFabricRuleInputSchema>;

/** Body of PATCH /api/admin/fabric-rules/{id}: any editable field; `when` and `effect` are replaced whole. */
export const updateFabricRuleInputSchema = ruleFields
  .extend({ isDraft: z.boolean() })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: EMPTY_PATCH });

/** Parsed update-rule body. */
export type UpdateFabricRuleInput = z.infer<typeof updateFabricRuleInputSchema>;

/** A recommendation rule as the admin sees it. */
export const adminFabricRuleSchema = fabricRuleSchema.extend({
  isDraft: z.boolean(),
  updatedAt: z.iso.datetime().meta({ example: "2026-10-28T10:00:00.000Z" }),
  updatedBy: z.uuid().nullable(),
});

/** A parsed admin rule. */
export type AdminFabricRule = z.infer<typeof adminFabricRuleSchema>;

/** Response of GET /api/admin/fabric-rules. */
export const adminFabricRuleListSchema = z.object({ items: z.array(adminFabricRuleSchema) });
