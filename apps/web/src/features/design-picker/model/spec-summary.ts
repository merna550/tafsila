/** Which sections the tailor has changed from the starting design, for the done mark in the navigation. */
import type { DesignSpec } from "@tafsila/schemas";
import { defaultSpec } from "@tafsila/engine/spec-rules";
import { SECTION_PATHS, type SectionId } from "./sections";
import { deepEqual, readFeature } from "./spec-path";

/**
 * Finds the sections whose features differ from `defaultSpec` of the same category.
 *
 * @param spec - The design being edited.
 * @param sections - The sections to check.
 * @returns The ids of changed sections.
 */
export function customisedSections(spec: DesignSpec, sections: readonly SectionId[]): SectionId[] {
  const start = defaultSpec(spec.category);
  return sections.filter((id) =>
    SECTION_PATHS[id].some((path) => !deepEqual(readFeature(spec, path), readFeature(start, path))),
  );
}
