/** What the viewer pane and the side panel derive from the save state and the preview. */
import type { ValidationReport } from "@tafsila/schemas";
import { previewErrorToApiError, type PreviewState } from "@/shared/pattern-preview";
import type { ApiError } from "@/shared/api";
import type { SaveState } from "./save-state";

/** Flags for the viewer pane. */
export interface ViewerFlags {
  /** A newer draft is running while an older drawing is shown. */
  readonly updating: boolean;
  /** The engine's failure to show instead of the drawing. */
  readonly error: ApiError | null;
}

/**
 * Derives the pane flags.
 *
 * @param state - The save state.
 * @param preview - The preview state.
 * @returns The flags.
 */
export function viewerFlags(state: SaveState, preview: PreviewState): ViewerFlags {
  const failed = state.kind === "preview-error" && preview.error !== undefined;
  return {
    updating: state.kind === "previewing" && preview.scene !== undefined,
    error: failed && preview.error ? previewErrorToApiError(preview.error) : null,
  };
}

/**
 * The report to show: the server's when it refused these inputs, else the preview's.
 *
 * @param rejected - The server's refusal report, or null.
 * @param preview - The preview state.
 * @returns The report, or null before the first draft.
 */
export function shownReport(
  rejected: ValidationReport | null,
  preview: PreviewState,
): ValidationReport | null {
  return rejected ?? preview.result?.validation ?? null;
}

/**
 * The editor URL of a design, keeping the client.
 *
 * @param designId - The design.
 * @param clientId - The client from the URL, if any.
 * @returns The path.
 */
export function editorPath(designId: string, clientId: string | undefined): string {
  return clientId === undefined ? `/designs/${designId}` : `/designs/${designId}?clientId=${clientId}`;
}
