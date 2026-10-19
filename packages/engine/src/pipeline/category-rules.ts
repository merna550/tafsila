/** Which spec parts each garment category needs or ignores, as data (FR-PAT-01, issue #144, decision 144, 1). */
import type { DesignSpec, ValidationCheck } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";

/** A base block the blocks step drafts. */
export type BlockName = "bodice" | "skirt";

/** An optional part of a design spec. */
export type SpecPart = "bodice" | "neckline" | "sleeve" | "skirt" | "waistband";

/** What one category needs and what it leaves out. */
export interface CategoryParts {
  /** Parts the category cannot be drafted without (a missing one is an input error). */
  readonly required: readonly SpecPart[];
  /** Parts the category does not use: one warning names them, then they are dropped. */
  readonly ignored: readonly SpecPart[];
}

/** Parts per category (decision 144, 1; a dress joins its skirt at the bodice, so it has no waistband, decision 140, 5). */
export const CATEGORY_PARTS: Readonly<Record<DesignSpec["category"], CategoryParts>> = {
  dress: { required: ["bodice", "skirt"], ignored: ["waistband"] },
  skirt: { required: ["skirt"], ignored: ["bodice", "neckline", "sleeve"] },
  blouse: { required: ["bodice"], ignored: ["skirt", "waistband"] },
};

/** Skirt types a one-piece dress (`waistSeam: false`) can be drafted with (decision 144, 2). */
export const ONE_PIECE_SKIRT_TYPES: readonly NonNullable<DesignSpec["skirt"]>["type"][] = [
  "straight",
  "a-line",
];

/** Blocks each category drafts in the blocks step, in order (the skirt is a module, #129). */
export const CATEGORY_BLOCKS: Readonly<Record<DesignSpec["category"], readonly BlockName[]>> = {
  dress: ["bodice", "skirt"],
  skirt: ["skirt"],
  blouse: ["bodice"],
};

/** The outcome of the category check. */
export interface CategoryCheck {
  /** The spec without its ignored parts; drafted instead of the given one. */
  readonly spec: DesignSpec;
  /** The `SPEC_PART_IGNORED` warning, when a part was dropped. */
  readonly checks: readonly ValidationCheck[];
}

/**
 * Whether a design is a dress drafted in one piece from shoulder to hem (no waist seam).
 *
 * @param spec - The design.
 * @returns True for a dress with `bodice.waistSeam: false`.
 */
export function isOnePieceDress(spec: Pick<DesignSpec, "category" | "bodice">): boolean {
  return spec.category === "dress" && spec.bodice?.waistSeam === false;
}

/**
 * Checks the parts of the spec against its category and drops the ignored ones.
 *
 * @param spec - A schema-valid design.
 * @returns The spec to draft and the warning for dropped parts.
 * @throws {DraftingError} SPEC_PART_MISSING when a required part is absent; DRESS_ONE_PIECE_SKIRT_UNSUPPORTED when a
 * one-piece dress has a skirt that cannot be joined without a waist seam. Both are input errors (a `fail` result).
 */
export function checkCategory(spec: DesignSpec): CategoryCheck {
  const parts = CATEGORY_PARTS[spec.category];
  const missing = parts.required.filter((part) => spec[part] === undefined);
  if (missing.length > 0) {
    throw new DraftingError("SPEC_PART_MISSING", `Category "${spec.category}" needs [${missing.join(", ")}]`);
  }
  if (isOnePieceDress(spec) && !ONE_PIECE_SKIRT_TYPES.includes(spec.skirt!.type)) {
    throw new DraftingError(
      "DRESS_ONE_PIECE_SKIRT_UNSUPPORTED",
      `A dress without a waist seam cannot have a ${spec.skirt!.type} skirt`,
    );
  }
  const dropped = parts.ignored.filter((part) => isUsed(spec, part));
  if (dropped.length === 0) return { spec, checks: [] };
  const kept: DesignSpec = { ...spec };
  for (const part of dropped) delete (kept as Partial<DesignSpec>)[part];
  return { spec: kept, checks: [ignoredCheck(spec.category, dropped)] };
}

/**
 * Whether a part is set to something that would draft: a `none` waistband asks for nothing, so it is not warned about.
 *
 * @param spec - The design.
 * @param part - The part.
 * @returns True when the part is present and not `none`.
 */
function isUsed(spec: DesignSpec, part: SpecPart): boolean {
  return spec[part] !== undefined && !(part === "waistband" && spec.waistband === "none");
}

/** Bilingual names of the spec parts, for the warning (copy glossary). */
const PART_NAMES: Readonly<Record<SpecPart, { readonly ar: string; readonly en: string }>> = {
  bodice: { ar: "الصدر", en: "bodice" },
  neckline: { ar: "فتحة الرقبة", en: "neckline" },
  sleeve: { ar: "الكم", en: "sleeve" },
  skirt: { ar: "التنورة", en: "skirt" },
  waistband: { ar: "حزام الوسط", en: "waistband" },
};

/** Bilingual category names, for the warning. */
const CATEGORY_NAMES: Readonly<Record<DesignSpec["category"], { readonly ar: string; readonly en: string }>> =
  {
    dress: { ar: "الفستان", en: "dress" },
    skirt: { ar: "التنورة", en: "skirt" },
    blouse: { ar: "البلوزة", en: "blouse" },
  };

/**
 * The FR-VAL-08 warning that names the parts a category does not use.
 *
 * @param category - The garment category.
 * @param dropped - The parts left out.
 * @returns A `warn` check.
 */
function ignoredCheck(category: DesignSpec["category"], dropped: readonly SpecPart[]): ValidationCheck {
  const ar = dropped.map((p) => PART_NAMES[p].ar).join("، ");
  const en = dropped.map((p) => PART_NAMES[p].en).join(", ");
  return {
    id: "FR-VAL-08",
    code: "SPEC_PART_IGNORED",
    status: "warn",
    message: {
      ar: `تصميم ${CATEGORY_NAMES[category].ar} لا يستخدم: ${ar}. تم تجاهلها في الباترون.`,
      en: `A ${CATEGORY_NAMES[category].en} does not use: ${en}. They were left out of the pattern.`,
    },
    refs: [...dropped],
  };
}
