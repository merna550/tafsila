"use client";
/** Turns the key actions of the projector page into changes of the view, fullscreen and the help window (issue #286). */
import { useCallback } from "react";
import type { FullscreenController, PiecesController } from "../model/controllers";
import type { ProjectorAction } from "../model/keymap";
import type { ProjectorViewController } from "./use-projector-view";

/**
 * Runs the actions that belong to pieces.
 *
 * @param pieces - The piece state and actions.
 * @param a - The action; others are ignored.
 */
function pieceAction(pieces: PiecesController, a: ProjectorAction): void {
  if (a.kind === "rotate") pieces.rotateActive();
  else if (a.kind === "reset") pieces.reset();
  else if (a.kind === "nextPiece" || a.kind === "prevPiece") pieces.step(a.kind === "nextPiece" ? 1 : -1);
  else if (a.kind === "allPieces") pieces.showAll();
  else if (a.kind === "pieces") pieces.togglePanel();
  else if (a.kind === "clearActive") pieces.activate(null);
}

/**
 * Builds the handler that {@link useProjectorKeys} calls. Arrow keys move the active piece, or pan when there is none (issue #287).
 *
 * @param projector - The view and its actions.
 * @param fullscreen - Fullscreen controls.
 * @param pieces - The piece state and actions.
 * @param openHelp - Opens the help window.
 * @returns The action handler.
 */
export function useProjectorActions(
  projector: ProjectorViewController,
  fullscreen: FullscreenController,
  pieces: PiecesController,
  openHelp: () => void,
): (action: ProjectorAction) => void {
  const { pan, toggleMirror, setLineWidth, view } = projector;
  const { isFullscreen, enter, exit } = fullscreen;
  return useCallback(
    (a: ProjectorAction) => {
      switch (a.kind) {
        case "pan":
          if (!pieces.moveActive({ x: a.dx * a.stepMm, y: a.dy * a.stepMm }))
            pan(a.dx * a.stepMm, a.dy * a.stepMm);
          break;
        case "mirror":
          toggleMirror();
          break;
        case "help":
          openHelp();
          break;
        case "lineWidth":
          setLineWidth(view.lineWidthPx + a.delta);
          break;
        case "fullscreen":
          (isFullscreen ? exit : enter)();
          break;
        default:
          pieceAction(pieces, a);
      }
    },
    [pan, toggleMirror, setLineWidth, view.lineWidthPx, isFullscreen, enter, exit, pieces, openHelp],
  );
}
