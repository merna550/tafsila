"use client";
/** Holds the piece selection, the active piece and the placements of one version, and keeps them for this viewer (issue #287). */
import type { PatternScene } from "@tafsila/engine/viewer";
import type { Point } from "@tafsila/schemas";
import { useCallback, useEffect, useState } from "react";
import {
  INITIAL_PLACEMENT_STATE,
  movePiece,
  nextPieceId,
  resetPlacements,
  rotatePiece,
  type PlacementState,
} from "../model/placement";
import { readPlacement, writePlacement } from "../model/placement-store";

/** What {@link usePlacements} returns. */
export interface PlacementsController {
  /** Selection, active piece and placements. */
  readonly state: PlacementState;
  /** Shows one piece and makes it the active one. */
  readonly selectPiece: (id: string) => void;
  /** Shows every piece. */
  readonly selectAll: () => void;
  /** Makes a piece active (the keys move it) or none. */
  readonly setActive: (id: string | null) => void;
  /** The id one step from the active (or shown) piece, wrapping around. */
  readonly neighbour: (step: 1 | -1) => string | null;
  /** Moves a piece by a screen move. */
  readonly move: (id: string, deltaMm: Point, mirror: boolean) => void;
  /** Turns the active piece by 180 degrees; false without an active piece. */
  readonly rotateActive: () => boolean;
  /** Back to the layout of the scene, all pieces shown. */
  readonly reset: () => void;
}

/**
 * The piece the next/previous step starts from: the active one, else the one shown alone.
 *
 * @param state - The state.
 * @returns The piece id, or null when none.
 */
function currentPieceId(state: PlacementState): string | null {
  if (state.activePieceId !== null) return state.activePieceId;
  return state.selection === "all" ? null : state.selection;
}

/**
 * Reads the stored state once the scene is there, then saves every change.
 *
 * @param versionId - The version.
 * @param scene - The scene, or undefined while it is drafted.
 * @returns The state and its actions.
 */
export function usePlacements(versionId: string, scene: PatternScene | undefined): PlacementsController {
  const [state, setState] = useState<PlacementState>(INITIAL_PLACEMENT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene || ready) return;
    const stored = readPlacement(versionId, scene);
    if (stored) setState(stored);
    setReady(true);
  }, [scene, ready, versionId]);

  useEffect(() => {
    if (ready) writePlacement(versionId, state);
  }, [ready, versionId, state]);

  const selectPiece = useCallback(
    (id: string) => setState((s) => ({ ...s, selection: id, activePieceId: id })),
    [],
  );
  const selectAll = useCallback(() => setState((s) => ({ ...s, selection: "all" })), []);
  const setActive = useCallback((id: string | null) => setState((s) => ({ ...s, activePieceId: id })), []);
  const move = useCallback(
    (id: string, delta: Point, mirror: boolean) => setState((s) => movePiece(s, id, delta, mirror)),
    [],
  );
  const rotateActive = useCallback(() => {
    if (state.activePieceId === null) return false;
    const id = state.activePieceId;
    setState((s) => rotatePiece(s, id));
    return true;
  }, [state.activePieceId]);
  const reset = useCallback(() => setState(resetPlacements()), []);
  const neighbour = useCallback(
    (step: 1 | -1) => (scene ? nextPieceId(scene, currentPieceId(state), step) : null),
    [scene, state],
  );

  return { state, selectPiece, selectAll, setActive, neighbour, move, rotateActive, reset };
}
