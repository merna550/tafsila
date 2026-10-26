/** Reads and writes the piece selection and placements of one version for this viewer; failures read as nothing stored (issue #287). */
import type { PatternScene } from "@tafsila/engine/viewer";
import { readJson, writeJson } from "@/shared/storage/safe-storage";
import { projectorPlacementSchema, type ProjectorPlacementStored } from "../projector.schema";
import { INITIAL_PLACEMENT_STATE, pruneToScene, type PlacementState } from "./placement";

/**
 * The `localStorage` key of one version's placements.
 *
 * @param versionId - The version.
 * @returns The key.
 */
export function placementKey(versionId: string): string {
  return `tafsila.projector.placement.${versionId}`;
}

/**
 * Reads the stored placements and drops pieces the scene no longer has.
 *
 * @param versionId - The version.
 * @param scene - The scene of that version.
 * @returns The state, or null when nothing valid is stored.
 */
export function readPlacement(versionId: string, scene: PatternScene): PlacementState | null {
  const parsed = projectorPlacementSchema.safeParse(readJson(placementKey(versionId)));
  if (!parsed.success) return null;
  const { selection, placements } = parsed.data;
  return pruneToScene({ ...INITIAL_PLACEMENT_STATE, selection, placements }, scene);
}

/**
 * Stores the selection and placements (not the active piece).
 *
 * @param versionId - The version.
 * @param state - The state.
 * @returns False when the browser refused.
 */
export function writePlacement(versionId: string, state: PlacementState): boolean {
  const value: ProjectorPlacementStored = {
    version: 1,
    selection: state.selection,
    placements: { ...state.placements },
  };
  return writeJson(placementKey(versionId), value);
}
