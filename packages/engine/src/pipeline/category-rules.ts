/** Which blocks each garment category needs, as data (FR-PAT-01). */
import type { DesignSpec } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";

/** A base block the blocks step drafts. */
export type BlockName = "bodice" | "skirt";

/** Blocks required by each category; every other part must be absent. */
export const CATEGORY_BLOCKS: Readonly<Record<DesignSpec["category"], readonly BlockName[]>> = {
  dress: ["bodice", "skirt"],
  skirt: ["skirt"],
  blouse: ["bodice"],
};

/** All blocks, to find the ones a category must not have. */
const ALL_BLOCKS: readonly BlockName[] = ["bodice", "skirt"];

/**
 * Checks the parts of the spec against its category.
 *
 * @param spec - A schema-valid design.
 * @returns The blocks the category needs.
 * @throws {DraftingError} PIPELINE_UNSUPPORTED_COMBINATION when a needed part is missing or an extra one is present.
 */
export function assertCategory(spec: DesignSpec): readonly BlockName[] {
  const needed = CATEGORY_BLOCKS[spec.category];
  const missing = needed.filter((b) => spec[b] === undefined);
  const extra = ALL_BLOCKS.filter((b) => !needed.includes(b) && spec[b] !== undefined);
  if (missing.length > 0 || extra.length > 0) {
    throw new DraftingError(
      "PIPELINE_UNSUPPORTED_COMBINATION",
      `Category "${spec.category}" needs [${needed.join(", ")}]; missing [${missing.join(", ")}], not allowed [${extra.join(", ")}]`,
    );
  }
  return needed;
}
