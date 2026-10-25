"use client";
/** The editor store (Zustand, ADR-011): the spec being edited, one undo level and the browser draft. */
import type { DesignSpec } from "@tafsila/schemas";
import type { FeaturePath, FeatureValue, OverridePath } from "@tafsila/engine/spec-rules";
import { create } from "zustand";
import { readJson, remove, writeJson } from "@/shared/storage/safe-storage";
import {
  EMPTY_EDITOR_STATE,
  acceptDraft,
  dismissNoticeState,
  hydrateState,
  isDirty,
  markSavedState,
  setFeatureState,
  setOverrideState,
  undoState,
  type EditorState,
} from "../model/editor-state";

/** The store: state plus the actions that change it. */
export interface EditorStore extends EditorState {
  /** Loads the server spec, or the local draft when it was made from this same spec. Keeps edits already in memory. */
  hydrate: (designId: string, spec: DesignSpec) => void;
  /** Sets a feature, applies the rules and fills `resetPaths`. */
  setFeature: (path: FeaturePath, value: FeatureValue | readonly string[]) => void;
  /** Sets a length override in mm, or removes it with undefined. */
  setOverride: (path: OverridePath, mm: number | undefined) => void;
  /** Restores the spec before the last change. */
  undo: () => void;
  /** Makes `spec` the baseline and drops the draft (called after saving). */
  markSaved: (spec: DesignSpec) => void;
  /** Hides the reset notice. */
  dismissNotice: () => void;
}

/**
 * Builds the draft storage key of a design.
 *
 * @param designId - The design.
 * @returns The key.
 */
export function draftKey(designId: string): string {
  return `tafsila.editor-draft.${designId}`;
}

/**
 * Stores the draft after a change, or removes it when the spec is back at the baseline.
 *
 * @param state - The new state.
 */
function persistDraft(state: EditorState): void {
  if (state.designId === null || state.spec === null || state.baseline === null) return;
  if (isDirty(state)) writeJson(draftKey(state.designId), { spec: state.spec, baseSpec: state.baseline });
  else remove(draftKey(state.designId));
}

/** The editor store hook. */
export const useEditorStore = create<EditorStore>((set, get) => {
  /**
   * Applies a pure step, saves the draft and publishes the result.
   *
   * @param step - Takes the current state and returns the next.
   */
  const apply = (step: (state: EditorState) => EditorState): void => {
    const next = step(get());
    if (next === get()) return;
    set(next);
    persistDraft(next);
  };
  return {
    ...EMPTY_EDITOR_STATE,
    hydrate: (designId, spec) => {
      if (get().designId === designId && get().spec !== null) return;
      set(hydrateState(designId, spec, acceptDraft(readJson(draftKey(designId)), spec)));
    },
    setFeature: (path, value) => apply((state) => setFeatureState(state, path, value)),
    setOverride: (path, mm) => apply((state) => setOverrideState(state, path, mm)),
    undo: () => apply(undoState),
    markSaved: (spec) => {
      const id = get().designId;
      set(markSavedState(get(), spec));
      if (id !== null) remove(draftKey(id));
    },
    dismissNotice: () => apply(dismissNoticeState),
  };
});

/**
 * Selects whether the design has unsaved changes.
 *
 * @param state - The store.
 * @returns True when the spec differs from the baseline.
 */
export function selectIsDirty(state: EditorState): boolean {
  return isDirty(state);
}
