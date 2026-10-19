/** The design features the picker offers, how to read and set one, and where its values come from (issue #238). */
import { designSpecSchema, type DesignSpec } from "@tafsila/schemas";
import { CATEGORY_PARTS, isUsed, type SpecPart } from "../pipeline/category-rules";
import { defaultSpec } from "./default-spec";

/** Every feature the picker lists, parents first: this is also the order `normalizeSpec` walks. */
export const FEATURE_PATHS = [
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
export type FeaturePath = (typeof FEATURE_PATHS)[number];

/** A value a feature can take: an enum value, a boolean, `"none"` for no slit, or a pocket style. */
export type FeatureValue = string | boolean;

/** The `DesignSpec` part a path belongs to, when it is an optional part. */
export type PartOf = Extract<SpecPart, "bodice" | "neckline" | "sleeve" | "skirt" | "waistband">;

/** A design seen as plain keys, for setting a feature by path. */
type Loose = Record<string, unknown>;

const shape = designSpecSchema.shape;

/** Candidate values per feature, read from the schema's enums so a new enum value appears without a second list. */
const CANDIDATES: Readonly<Record<FeaturePath, readonly FeatureValue[]>> = {
  category: shape.category.options,
  "bodice.shaping": shape.bodice.unwrap().shape.shaping.options,
  "bodice.fit": shape.bodice.unwrap().shape.fit.options,
  "bodice.waistSeam": [true, false],
  "skirt.type": shape.skirt.unwrap().shape.type.options,
  "skirt.length": shape.skirt.unwrap().shape.length.options,
  "skirt.slit": ["none", ...shape.skirt.unwrap().shape.slit.unwrap().shape.position.options],
  waistband: shape.waistband.unwrap().options,
  "neckline.front": shape.neckline.unwrap().shape.front.options,
  "neckline.back": shape.neckline.unwrap().shape.back.options,
  "neckline.collar": shape.neckline.unwrap().shape.collar.options,
  "sleeve.type": shape.sleeve.unwrap().shape.type.options,
  "sleeve.length": shape.sleeve.unwrap().shape.length.options,
  "sleeve.cuff": shape.sleeve.unwrap().shape.cuff.options,
  "closure.type": shape.closure.shape.type.options,
  "closure.position": shape.closure.shape.position.options,
  pockets: shape.pockets.element.options,
  belt: shape.belt.unwrap().options,
  lining: [true, false],
};

/** Slit length given to a slit the picker adds (the picker has no slit length control in release 1). */
export const PICKER_SLIT_LENGTH_MM = 100;

/**
 * The values to try for a feature.
 *
 * @param path - The feature.
 * @returns Its values in schema order.
 */
export function candidateValues(path: FeaturePath): readonly FeatureValue[] {
  return CANDIDATES[path];
}

/**
 * The optional part a feature lives in.
 *
 * @param path - The feature.
 * @returns The part, or undefined for top-level features (category, closure, pockets, belt, lining).
 */
export function partOf(path: FeaturePath): PartOf | undefined {
  const head = path.split(".")[0];
  return head === "bodice" ||
    head === "neckline" ||
    head === "sleeve" ||
    head === "skirt" ||
    head === "waistband"
    ? head
    : undefined;
}

/**
 * Whether a feature exists for a category: its part is not ignored, and the waist seam is a dress choice.
 *
 * @param category - The garment category.
 * @param path - The feature.
 * @returns True when the picker should offer it.
 */
export function featureApplies(category: DesignSpec["category"], path: FeaturePath): boolean {
  const part = partOf(path);
  if (part !== undefined && CATEGORY_PARTS[category].ignored.includes(part)) return false;
  return path === "bodice.waistSeam" ? category === "dress" : true;
}

/**
 * Parts of the design that its category ignores and that are set to something.
 *
 * @param spec - The design.
 * @returns The part names, in category order.
 */
export function ignoredPartsSet(spec: DesignSpec): PartOf[] {
  return CATEGORY_PARTS[spec.category].ignored.filter((part) => isUsed(spec, part));
}

/**
 * The design as the engine drafts it: parts the category ignores are removed.
 *
 * @param spec - The design.
 * @returns A copy without the ignored parts.
 */
export function withoutIgnoredParts(spec: DesignSpec): DesignSpec {
  const kept: DesignSpec = { ...spec };
  for (const part of CATEGORY_PARTS[spec.category].ignored) delete (kept as Partial<DesignSpec>)[part];
  return kept;
}

/**
 * A part taken from the starting designs, for a design that lacks it.
 *
 * @param part - The part.
 * @returns A fresh copy of the part's starting value.
 */
function startingPart<P extends PartOf>(part: P): NonNullable<DesignSpec[P]> {
  const source = part === "waistband" ? defaultSpec("skirt") : defaultSpec("dress");
  return structuredClone(source[part]) as NonNullable<DesignSpec[P]>;
}

/**
 * The same design with its category's required parts filled in from the starting design.
 *
 * @param spec - The design.
 * @returns A copy; the given design is untouched.
 */
export function withRequiredParts(spec: DesignSpec): DesignSpec {
  const next = structuredClone(spec) as Record<string, unknown>;
  for (const part of CATEGORY_PARTS[spec.category].required) next[part] ??= startingPart(part);
  return next as unknown as DesignSpec;
}

/**
 * Sets one feature on a copy of the design.
 *
 * @param spec - The design.
 * @param path - The feature.
 * @param value - One of `candidateValues(path)`: for `pockets` the one style to carry, for `skirt.slit` a position or `"none"`.
 * @returns A copy with the value set; a missing part is created first, a category change fills its required parts.
 */
export function withFeatureValue(spec: DesignSpec, path: FeaturePath, value: FeatureValue): DesignSpec {
  const next = structuredClone(spec) as unknown as Loose;
  if (path === "category") return withRequiredParts({ ...next, category: value } as unknown as DesignSpec);
  if (path === "pockets") return { ...spec, pockets: [value as DesignSpec["pockets"][number]] };
  const [group, field] = path.split(".") as [string, string | undefined];
  const part = partOf(path);
  if (part !== undefined) next[part] ??= startingPart(part);
  if (field === undefined) next[group] = value;
  else if (path === "skirt.slit") setSlit(next.skirt as Loose, value as string);
  else (next[group] as Loose)[field] = value;
  return next as unknown as DesignSpec;
}

/**
 * Adds, moves or removes the skirt's slit.
 *
 * @param skirt - The skirt part, changed in place.
 * @param position - `"none"` or a slit position.
 */
function setSlit(skirt: Loose, position: string): void {
  if (position === "none") delete skirt.slit;
  else skirt.slit = { position, lengthMm: PICKER_SLIT_LENGTH_MM };
}
