"use client";
/** Hook that moves the page to the version a chat proposal was applied as (FR-CHAT-03). */
import type { PatternVersion } from "@tafsila/schemas";
import { useCallback } from "react";
import { useEditorStore } from "@/features/design-picker";
import { fromVersion } from "@/features/pattern-options";
import { usePageStore } from "./use-page-store";

/**
 * Returns the callback the chat panel calls after an apply: the editor and the page stores take the new version, so the viewer
 * redraws from it and the save bar shows it as saved.
 *
 * @param designId - The design on the page.
 * @returns The callback.
 */
export function useChatApplied(designId: string): (version: PatternVersion) => void {
  return useCallback(
    (version) => {
      const page = usePageStore.getState();
      if (page.designId !== designId) return;
      useEditorStore.getState().markSaved(version.spec);
      page.replace(fromVersion(version, page.options?.clientId ?? null), {
        id: version.id,
        versionNo: version.versionNo,
        inputHash: version.inputHash,
      });
    },
    [designId],
  );
}
