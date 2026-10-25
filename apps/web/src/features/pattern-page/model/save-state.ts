/** The save button's state as one pure function with a fixed order (decision 251-3, 251-5). */
import type { PreviewInput, PreviewState } from "@/shared/pattern-preview";

/** What the page knows about the version it started from or last saved. */
export interface BaseVersion {
  /** Version id. */
  readonly id: string;
  /** Version number within the design. */
  readonly versionNo: number;
  /** The version's `input_hash`. */
  readonly inputHash: string;
}

/** Why the button looks the way it does; the first matching kind wins. */
export type SaveKind =
  | "loading"
  | "no-set"
  | "previewing"
  | "preview-error"
  | "server-rejected"
  | "fail"
  | "saving"
  | "saved"
  | "outdated"
  | "unsaved";

/** Everything the decision needs. */
export interface SaveStateInput {
  /** The design or its set is still loading. */
  readonly loading: boolean;
  /** The current preview input, null without a measurement set. */
  readonly currentInput: PreviewInput | null;
  /** The preview hook's state. */
  readonly preview: Pick<PreviewState, "status" | "input" | "result">;
  /** The server refused these same inputs (422). */
  readonly rejected: boolean;
  /** A save request is running. */
  readonly saving: boolean;
  /** The spec or options differ from the last loaded or saved ones. */
  readonly dirty: boolean;
  /** The version the page started from or last saved, if any. */
  readonly baseVersion: BaseVersion | null;
}

/** The state of the save area. */
export interface SaveState {
  /** The kind. */
  readonly kind: SaveKind;
  /** The saved version the state talks about (saved, outdated). */
  readonly versionNo?: number;
}

/**
 * The kind while the preview does not yet answer the current input, or has failed on it.
 *
 * @param input - Page facts.
 * @param currentInput - The page's current preview input.
 * @returns `previewing`, `preview-error`, or null when the preview is ready.
 */
function previewBlock(input: SaveStateInput, currentInput: PreviewInput): SaveKind | null {
  const { preview } = input;
  if (preview.status === "idle" || preview.status === "running" || preview.input !== currentInput) {
    return "previewing";
  }
  return preview.status === "error" ? "preview-error" : null;
}

/**
 * The state of a ready, passing preview against the version it started from.
 *
 * @param input - Page facts.
 * @returns saved, outdated or unsaved.
 */
function versionState(input: SaveStateInput): SaveState {
  const { baseVersion } = input;
  if (baseVersion === null) return { kind: "unsaved" };
  if (input.preview.result?.meta.createdFrom === baseVersion.inputHash) {
    return { kind: "saved", versionNo: baseVersion.versionNo };
  }
  return input.dirty ? { kind: "unsaved" } : { kind: "outdated", versionNo: baseVersion.versionNo };
}

/**
 * Decides the save state. A preview is current only when it answered the very input the page holds now, so a draft
 * of older inputs never enables Save.
 *
 * @param input - Page facts.
 * @returns The state.
 */
export function saveStateOf(input: SaveStateInput): SaveState {
  if (input.loading) return { kind: "loading" };
  if (input.currentInput === null) return { kind: "no-set" };
  const blocked = previewBlock(input, input.currentInput);
  if (blocked !== null) return { kind: blocked };
  if (input.rejected) return { kind: "server-rejected" };
  if (input.preview.result?.validation.status === "fail") return { kind: "fail" };
  if (input.saving) return { kind: "saving" };
  return versionState(input);
}

/**
 * Whether the Save button may be pressed.
 *
 * @param state - The save state.
 * @returns True for a new or an outdated version.
 */
export function canSave(state: SaveState): boolean {
  return state.kind === "unsaved" || state.kind === "outdated";
}
