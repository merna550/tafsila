/** The export dialog's state machine as a pure reducer: idle, running, done, error (issue #289). */
import type { ApiError } from "../api";
import type { ExportKind, ExportProgress } from "./protocol";

/** The finished file kept for "Download again". */
export interface ExportFile {
  /** Name the browser saves it under. */
  readonly fileName: string;
  /** Media type. */
  readonly mime: string;
  /** The file content. */
  readonly bytes: ArrayBuffer;
  /** Pages of a PDF, null for SVG. */
  readonly pageCount: number | null;
}

/** Where an export is. */
export type ExportState =
  | { readonly status: "idle" }
  | { readonly status: "running"; readonly kind: ExportKind; readonly progress: ExportProgress | null }
  | { readonly status: "done"; readonly kind: ExportKind; readonly file: ExportFile }
  | { readonly status: "error"; readonly kind: ExportKind; readonly error: ApiError };

/** What can happen to an export. */
export type ExportAction =
  | { readonly type: "start"; readonly kind: ExportKind }
  | { readonly type: "progress"; readonly progress: ExportProgress }
  | { readonly type: "done"; readonly file: ExportFile }
  | { readonly type: "fail"; readonly error: ApiError }
  | { readonly type: "reset" };

/** The state before anything runs. */
export const IDLE_EXPORT_STATE: ExportState = { status: "idle" };

/**
 * Moves the export to its next state. Answers that arrive when nothing is running (after a cancel or a reset) are ignored.
 *
 * @param state - The current state.
 * @param action - What happened.
 * @returns The next state.
 */
export function exportReducer(state: ExportState, action: ExportAction): ExportState {
  if (action.type === "reset") return IDLE_EXPORT_STATE;
  if (action.type === "start") return { status: "running", kind: action.kind, progress: null };
  if (state.status !== "running") return state;
  switch (action.type) {
    case "progress":
      return { ...state, progress: action.progress };
    case "done":
      return { status: "done", kind: state.kind, file: action.file };
    case "fail":
      return { status: "error", kind: state.kind, error: action.error };
  }
}
