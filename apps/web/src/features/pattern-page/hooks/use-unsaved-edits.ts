"use client";
/** Hook that tells whether this design has edits in memory that a restore would replace. */
import { selectIsDirty, useEditorStore } from "@/features/design-picker";
import { optionsEqual } from "../model/options-equal";
import { usePageStore } from "./use-page-store";

/**
 * True when the editor or the options of this design differ from what was last loaded or saved.
 *
 * @param designId - Design id.
 * @returns Whether unsaved edits exist.
 */
export function useUnsavedEdits(designId: string): boolean {
  const specDirty = useEditorStore((s) => s.designId === designId && selectIsDirty(s));
  const optionsDirty = usePageStore((s) => s.designId === designId && !optionsEqual(s.options, s.baseline));
  return specDirty || optionsDirty;
}
