"use client";
/** Turns the key actions of the projector page into changes of the view, fullscreen and the help window (issue #286). */
import { useCallback } from "react";
import type { FullscreenController } from "../model/controllers";
import type { ProjectorAction } from "../model/keymap";
import type { ProjectorViewController } from "./use-projector-view";

/**
 * Builds the handler that {@link useProjectorKeys} calls. Piece actions belong to issue #287 and are ignored here.
 *
 * @param projector - The view and its actions.
 * @param fullscreen - Fullscreen controls.
 * @param openHelp - Opens the help window.
 * @returns The action handler.
 */
export function useProjectorActions(
  projector: ProjectorViewController,
  fullscreen: FullscreenController,
  openHelp: () => void,
): (action: ProjectorAction) => void {
  const { pan, toggleMirror, setLineWidth, view } = projector;
  const { isFullscreen, enter, exit } = fullscreen;
  return useCallback(
    (a: ProjectorAction) => {
      switch (a.kind) {
        case "pan":
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
          break;
      }
    },
    [pan, toggleMirror, setLineWidth, view.lineWidthPx, isFullscreen, enter, exit, openHelp],
  );
}
