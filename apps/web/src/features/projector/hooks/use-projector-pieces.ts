"use client";
/** Joins the piece state with the view: choosing a piece centres it once, arrow keys move the active piece, reset also resets the pan (issue #287). */
import type { PatternScene } from "@tafsila/engine/viewer";
import type { Point } from "@tafsila/schemas";
import { useCallback, useState } from "react";
import type { PiecesController } from "../model/controllers";
import { centreOnPiece, visiblePieceIds } from "../model/placement";
import { DEFAULT_VIEW } from "../model/projector-view";
import { usePlacements } from "./use-placements";
import type { ProjectorViewController } from "./use-projector-view";

/**
 * Builds the piece controller of the projector page.
 *
 * @param versionId - The version.
 * @param scene - The scene, or undefined while it is drafted.
 * @param projector - The view, for the pan and the mirror.
 * @returns The state for the canvas and the actions for keys and panel.
 */
export function useProjectorPieces(
  versionId: string,
  scene: PatternScene | undefined,
  projector: ProjectorViewController,
): PiecesController {
  const placements = usePlacements(versionId, scene);
  const [panelOpen, setPanelOpen] = useState(true);
  const { state } = placements;
  const { setPan, view } = projector;
  const mirror = view.mirror;

  const choose = useCallback(
    (id: string) => {
      placements.selectPiece(id);
      if (scene) setPan(centreOnPiece(scene, state.placements, id, mirror));
    },
    [placements, scene, setPan, state.placements, mirror],
  );
  const step = useCallback(
    (by: 1 | -1) => {
      const id = placements.neighbour(by);
      if (id !== null) choose(id);
    },
    [placements, choose],
  );
  const moveActive = useCallback(
    (delta: Point): boolean => {
      if (state.activePieceId === null) return false;
      placements.move(state.activePieceId, delta, mirror);
      return true;
    },
    [placements, state.activePieceId, mirror],
  );
  const reset = useCallback(() => {
    placements.reset();
    setPan(DEFAULT_VIEW.panMm);
  }, [placements, setPan]);
  const move = useCallback(
    (id: string, delta: Point) => placements.move(id, delta, mirror),
    [placements, mirror],
  );

  return {
    state,
    visible: scene ? visiblePieceIds(scene, state.selection) : "all",
    panelOpen,
    togglePanel: () => setPanelOpen((open) => !open),
    choose,
    showAll: placements.selectAll,
    step,
    activate: placements.setActive,
    moveActive,
    move,
    rotateActive: placements.rotateActive,
    reset,
  };
}
