/** What each section of the picker shows: one table, read by one generic panel (issue #246, decision 246). */
import type { FeaturePath, OverridePath } from "@tafsila/engine/spec-rules";
import type { SectionId } from "./sections";

/** One thing the tailor can set. */
export type FieldConfig =
  | { readonly kind: "choice"; readonly path: FeaturePath }
  | { readonly kind: "multi"; readonly path: "pockets" }
  | { readonly kind: "number"; readonly path: OverridePath };

/** The fields of every section, in the order they are shown. A new engine feature path fails the test until it is listed here. */
export const FIELDS_BY_SECTION: Readonly<Record<SectionId, readonly FieldConfig[]>> = {
  bodice: [
    { kind: "choice", path: "bodice.shaping" },
    { kind: "choice", path: "bodice.fit" },
    { kind: "choice", path: "bodice.waistSeam" },
  ],
  neckline: [
    { kind: "choice", path: "neckline.front" },
    { kind: "choice", path: "neckline.back" },
    { kind: "choice", path: "neckline.collar" },
    { kind: "number", path: "neckline.depthFrontMm" },
  ],
  sleeve: [
    { kind: "choice", path: "sleeve.type" },
    { kind: "choice", path: "sleeve.length" },
    { kind: "choice", path: "sleeve.cuff" },
  ],
  skirt: [
    { kind: "choice", path: "skirt.type" },
    { kind: "choice", path: "skirt.length" },
    { kind: "number", path: "skirt.lengthMm" },
    { kind: "choice", path: "skirt.slit" },
    { kind: "number", path: "skirt.slit.lengthMm" },
  ],
  waistband: [{ kind: "choice", path: "waistband" }],
  closure: [
    { kind: "choice", path: "closure.type" },
    { kind: "choice", path: "closure.position" },
  ],
  pockets: [{ kind: "multi", path: "pockets" }],
  extras: [
    { kind: "choice", path: "lining" },
    { kind: "choice", path: "belt" },
  ],
};

/** The feature paths the sections do not show: the garment type, chosen on the first screen. */
export const PATHS_OUTSIDE_SECTIONS: readonly FeaturePath[] = ["category"];

/**
 * Lists every feature path the picker should show in a section.
 *
 * @returns All paths of the table, choices and multi-selects only.
 */
export function shownFeaturePaths(): FeaturePath[] {
  return Object.values(FIELDS_BY_SECTION)
    .flat()
    .flatMap((f) => (f.kind === "number" ? [] : [f.path]));
}
