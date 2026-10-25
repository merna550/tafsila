/** The editor's state and the pure steps that change it (no React, no store): the store only wires these. */
import { designSpecSchema, type DesignSpec } from "@tafsila/schemas";
import {
  normalizeSpec,
  withFeatureValue,
  type FeaturePath,
  type FeatureValue,
  type OverridePath,
} from "@tafsila/engine/spec-rules";
import { withOverride } from "./override-spec";
import { deepEqual } from "./spec-path";

/** What the editor keeps: editing state only, never server data. */
export interface EditorState {
  /** The design being edited, or null before `hydrate`. */
  readonly designId: string | null;
  /** The spec being edited. */
  readonly spec: DesignSpec | null;
  /** The last loaded or saved spec; dirty means `spec` differs from it. */
  readonly baseline: DesignSpec | null;
  /** The spec before the last change: one level of undo. */
  readonly previous: DesignSpec | null;
  /** Features that the rules changed on the last `setFeature`, for the notice. */
  readonly resetPaths: readonly FeaturePath[];
}

/** A browser draft: the edited spec and the server spec it was edited from. */
export interface EditorDraft {
  /** The edited spec. */
  readonly spec: DesignSpec;
  /** The server spec the draft started from. */
  readonly baseSpec: DesignSpec;
}

/** The state before any design is loaded. */
export const EMPTY_EDITOR_STATE: EditorState = {
  designId: null,
  spec: null,
  baseline: null,
  previous: null,
  resetPaths: [],
};

/**
 * Reads a stored draft and accepts it only when it is valid and was made from the same server spec.
 *
 * @param raw - The stored value (anything).
 * @param serverSpec - The spec the server gave.
 * @returns The draft's spec, or null when it must be ignored.
 */
export function acceptDraft(raw: unknown, serverSpec: DesignSpec): DesignSpec | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { spec, baseSpec } = raw as Record<string, unknown>;
  const parsedBase = designSpecSchema.safeParse(baseSpec);
  const parsedSpec = designSpecSchema.safeParse(spec);
  if (!parsedBase.success || !parsedSpec.success) return null;
  return deepEqual(parsedBase.data, serverSpec) ? parsedSpec.data : null;
}

/**
 * Starts editing a design from the server spec, or from a matching draft.
 *
 * @param designId - The design.
 * @param serverSpec - The spec the server gave.
 * @param draftSpec - A draft accepted by {@link acceptDraft}, if any.
 * @returns The new state.
 */
export function hydrateState(
  designId: string,
  serverSpec: DesignSpec,
  draftSpec: DesignSpec | null,
): EditorState {
  return { ...EMPTY_EDITOR_STATE, designId, spec: draftSpec ?? serverSpec, baseline: serverSpec };
}

/**
 * Sets one feature, lets the rules correct what no longer fits, and remembers the corrections.
 *
 * @param state - The current state.
 * @param path - The feature.
 * @param value - The new value; for `pockets` an array replaces all styles.
 * @returns The new state (the same object when nothing changed).
 */
export function setFeatureState(
  state: EditorState,
  path: FeaturePath,
  value: FeatureValue | readonly string[],
): EditorState {
  if (state.spec === null) return state;
  const raw =
    path === "pockets" && Array.isArray(value)
      ? { ...state.spec, pockets: value as DesignSpec["pockets"] }
      : withFeatureValue(state.spec, path, value as FeatureValue);
  return commitState(state, raw);
}

/**
 * Sets or removes a length override (in mm), applies the rules and fills the reset notice.
 *
 * @param state - The editor state.
 * @param path - The override.
 * @param mm - The new value, or undefined to remove it.
 * @returns The next state; the same object when nothing changed.
 */
export function setOverrideState(
  state: EditorState,
  path: OverridePath,
  mm: number | undefined,
): EditorState {
  if (state.spec === null) return state;
  return commitState(state, withOverride(state.spec, path, mm));
}

/**
 * Normalises a raw edit and records it as one undo step.
 *
 * @param state - The editor state, with a spec.
 * @param raw - The edited design.
 * @returns The next state; the same object when the design did not change.
 */
function commitState(state: EditorState, raw: DesignSpec): EditorState {
  const { spec, changed } = normalizeSpec(raw);
  if (deepEqual(spec, state.spec)) return state;
  return { ...state, spec, previous: state.spec, resetPaths: changed };
}

/**
 * Goes back one change.
 *
 * @param state - The current state.
 * @returns The state with the previous spec, or the same state when there is nothing to undo.
 */
export function undoState(state: EditorState): EditorState {
  if (state.previous === null) return state;
  return { ...state, spec: state.previous, previous: null, resetPaths: [] };
}

/**
 * Marks a spec as saved: it becomes the baseline.
 *
 * @param state - The current state.
 * @param spec - The saved spec.
 * @returns The new state.
 */
export function markSavedState(state: EditorState, spec: DesignSpec): EditorState {
  return { ...state, spec, baseline: spec, previous: null, resetPaths: [] };
}

/**
 * Hides the reset notice.
 *
 * @param state - The current state.
 * @returns The state without reset paths.
 */
export function dismissNoticeState(state: EditorState): EditorState {
  return state.resetPaths.length === 0 ? state : { ...state, resetPaths: [] };
}

/**
 * Tells whether the spec differs from the last loaded or saved one.
 *
 * @param state - The state.
 * @returns True when there are unsaved changes.
 */
export function isDirty(state: Pick<EditorState, "spec" | "baseline">): boolean {
  return !deepEqual(state.spec, state.baseline);
}
