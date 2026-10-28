"use client";
/** Layout-mode view: the pan stays inside the marker, the view starts at the beginning of the strip, and reset goes back there (issue #321). */
import { useCallback, useEffect, useRef } from "react";
import { clampPan, startPan, type ProjectorSceneData } from "../model/projector-mode";
import { pxToMm } from "../model/projector-view";
import type { ProjectorCalibration } from "../projector.schema";
import type { ProjectorViewController } from "./use-projector-view";

/** What {@link useLayoutView} returns. */
export interface LayoutViewController {
  /** The view controller with pan limited to the marker. */
  readonly projector: ProjectorViewController;
  /** Puts the view back at the beginning of the strip. */
  readonly toStart: () => void;
}

/**
 * Reads the screen size in mm; only called from effects and handlers, so never on the server.
 *
 * @param calibration - The calibration of this device.
 * @returns The size of the window in mm.
 */
function screenMm(calibration: ProjectorCalibration): { x: number; y: number } {
  return pxToMm(calibration, { x: window.innerWidth, y: window.innerHeight });
}

/**
 * Wraps the projector view for a marker scene.
 *
 * @param scene - The marker scene, or undefined while it is calculated.
 * @param calibration - The calibration, or null while it is read.
 * @param base - The projector view controller.
 * @returns The limited controller and the way back to the start.
 */
export function useLayoutView(
  scene: ProjectorSceneData | undefined,
  calibration: ProjectorCalibration | null,
  base: ProjectorViewController,
): LayoutViewController {
  const { setPan, view } = base;
  const started = useRef(false);

  const toStart = useCallback(() => {
    if (scene && calibration) setPan(startPan(scene, screenMm(calibration)));
  }, [scene, calibration, setPan]);

  useEffect(() => {
    if (started.current || !scene || !calibration) return;
    started.current = true;
    toStart();
  }, [scene, calibration, toStart]);

  const pan = useCallback(
    (dx: number, dy: number) => {
      if (!scene || !calibration) return;
      setPan(clampPan({ x: view.panMm.x + dx, y: view.panMm.y + dy }, scene, screenMm(calibration)));
    },
    [scene, calibration, setPan, view.panMm],
  );
  return { projector: { ...base, pan }, toStart };
}
