/** Patch operations a chat edit proposes on a DesignSpec (issue #337, FR-CHAT-02, FR-CHAT-04). */
import { z } from "zod";
import { designFeaturePathSchema, designLengthPathSchema } from "./design-analysis";
import { designSpecSchema } from "./design-spec";
import { bilingualTextSchema } from "./fabric";

/** A pocket style. */
export const pocketStyleSchema = designSpecSchema.shape.pockets.element;

/** One change to a design. `set` takes a value the feature's enum allows (checked by `applySpecPatch`). */
export const specPatchOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("set"),
    path: designFeaturePathSchema,
    value: z.union([z.string(), z.boolean()]),
  }),
  z.object({ op: z.literal("setLength"), path: designLengthPathSchema, mm: z.number().positive() }),
  z.object({ op: z.literal("addPocket"), type: pocketStyleSchema }),
  z.object({ op: z.literal("removePocket"), type: pocketStyleSchema }),
]);

/** One change to a design. */
export type SpecPatchOp = z.infer<typeof specPatchOpSchema>;

/** A request the engine cannot do, with the closest changes it can do instead. */
export const unsupportedRequestSchema = z.object({
  text: bilingualTextSchema,
  closest: z.array(specPatchOpSchema).optional(),
});

/** A request the engine cannot do. */
export type UnsupportedRequest = z.infer<typeof unsupportedRequestSchema>;

/** The changes a chat message asks for, in order, and what of it is not supported. */
export const specPatchSchema = z.object({
  ops: z.array(specPatchOpSchema),
  unsupported: unsupportedRequestSchema.optional(),
});

/** The changes a chat message asks for. */
export type SpecPatch = z.infer<typeof specPatchSchema>;
