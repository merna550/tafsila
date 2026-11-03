/** The features of the confirmation screen, grouped by the picker's sections (FR-DES-03). */
import type { FeaturePath, SpecOptions } from "@tafsila/engine/spec-rules";
import { SECTION_PATHS, sectionsFor, type SectionId } from "@/features/design-picker";

/** One section with the features that apply to the design. */
export interface FeatureGroup {
  /** The picker section. */
  readonly section: SectionId;
  /** Its features that apply, in order. */
  readonly paths: readonly FeaturePath[];
}

/**
 * Groups the applicable features by section; sections with none are left out.
 *
 * @param options - `specOptions(spec)` of the design.
 * @returns The groups in the picker's order.
 */
export function featureGroups(options: SpecOptions): FeatureGroup[] {
  return sectionsFor(options).map((section) => ({
    section,
    paths: SECTION_PATHS[section].filter((path) => options[path].applies),
  }));
}
