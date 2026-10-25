/** The editor's sections and which of them a garment uses; derived from the rules, never from a second category table. */
import type { FeaturePath, SpecOptions } from "@tafsila/engine/spec-rules";

/** Every section, in the order the tailor works through them. */
export const SECTION_ORDER = [
  "bodice",
  "neckline",
  "sleeve",
  "skirt",
  "waistband",
  "closure",
  "pockets",
  "extras",
] as const;

/** One section id. */
export type SectionId = (typeof SECTION_ORDER)[number];

/** The features each section holds. */
export const SECTION_PATHS: Readonly<Record<SectionId, readonly FeaturePath[]>> = {
  bodice: ["bodice.shaping", "bodice.fit", "bodice.waistSeam"],
  neckline: ["neckline.front", "neckline.back", "neckline.collar"],
  sleeve: ["sleeve.type", "sleeve.length", "sleeve.cuff"],
  skirt: ["skirt.type", "skirt.length", "skirt.slit"],
  waistband: ["waistband"],
  closure: ["closure.type", "closure.position"],
  pockets: ["pockets"],
  extras: ["belt", "lining"],
};

/**
 * Tells whether a value from the URL is a section id.
 *
 * @param value - Any text.
 * @returns True for a known section.
 */
export function isSectionId(value: string | null | undefined): value is SectionId {
  return SECTION_ORDER.some((id) => id === value);
}

/**
 * Lists the sections a garment uses: a section stays when any of its features applies.
 *
 * @param options - `specOptions(spec)` of the design.
 * @returns The section ids in order.
 */
export function sectionsFor(options: SpecOptions): SectionId[] {
  return SECTION_ORDER.filter((id) => SECTION_PATHS[id].some((path) => options[path].applies));
}
