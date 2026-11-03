/** Hands a spec to the pattern editor as its browser draft, so a screen outside the picker can start an edit (issue #342). */
import { defaultSpec } from "@tafsila/engine/spec-rules";
import type { DesignSpec, GarmentCategory } from "@tafsila/schemas";
import { writeJson } from "@/shared/storage/safe-storage";
import { draftKey } from "./use-editor-store";

/**
 * Stores `spec` as the editor draft of a design. The editor accepts it because its base is the spec a new
 * design of this category starts from, the same one `useEditorFrame` loads.
 *
 * @param designId - The design.
 * @param category - The category the design was created with.
 * @param spec - The spec to edit, such as one the user confirmed.
 * @returns True when the draft was stored, false when browser storage refused.
 */
export function seedEditorDraft(designId: string, category: GarmentCategory, spec: DesignSpec): boolean {
  return writeJson(draftKey(designId), { spec, baseSpec: defaultSpec(category) });
}
