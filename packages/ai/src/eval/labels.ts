/**
 * The evaluation labels (issue #338, decision 335, 2): one tailor-labelled design per photo. The photos stay outside
 * the repo; `labels.json` holds only the photo's file name (or key) and the expected design.
 */
import { designSpecSchema, garmentCategorySchema } from "@tafsila/schemas";
import { z } from "zod";

/** One labelled photo: the photo name, its category, the design a tailor would draft, and what we cannot draft. */
export const evalLabelSchema = z
  .object({
    id: z.string().min(1),
    photo: z.string().min(1),
    category: garmentCategorySchema,
    spec: designSpecSchema,
    unsupported: z.array(z.string().min(1)).default([]),
  })
  .refine((label) => label.spec.category === label.category, {
    message: "category must equal spec.category",
    path: ["category"],
  });

/** One labelled photo. */
export type EvalLabel = z.infer<typeof evalLabelSchema>;

/** The whole `labels.json`: a list with unique ids. */
export const evalLabelsSchema = z
  .array(evalLabelSchema)
  .refine((labels) => new Set(labels.map((label) => label.id)).size === labels.length, {
    message: "label ids must be unique",
  });

/**
 * Parses and checks a labels file, sorted by id so every run uses the same order.
 *
 * @param json - The file's text.
 * @returns The labels, sorted by id (ids are unique; code-point order, the same on every machine).
 * @throws {z.ZodError} When a label does not match the schema.
 * @example
 * parseLabels(readFileSync("labels.json", "utf8"));
 */
export function parseLabels(json: string): EvalLabel[] {
  return evalLabelsSchema.parse(JSON.parse(json)).toSorted((a, b) => (a.id < b.id ? -1 : 1));
}
