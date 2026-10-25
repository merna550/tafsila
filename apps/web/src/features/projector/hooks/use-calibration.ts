"use client";
/** The calibration of this device, read after mount and judged against the live screen size (issue #285). */
import { useCallback, useEffect, useState } from "react";
import {
  LOADING_STATE,
  readCalibration,
  writeCalibration,
  type CalibrationState,
} from "../model/calibration-store";
import type { ProjectorCalibration, ScreenInfo } from "../projector.schema";

/** What {@link useCalibration} returns. */
export interface CalibrationController {
  /** Loading until mounted, then missing, stale or ok. */
  readonly state: CalibrationState;
  /** The screen now, or null before mount. */
  readonly screen: ScreenInfo | null;
  /** Stores a calibration; false when storage refused. */
  readonly save: (calibration: ProjectorCalibration) => boolean;
}

/**
 * Reads `window.screen` and the stored calibration in an effect (never during the server render) and again on resize.
 *
 * @returns The state, the screen and a save function.
 */
export function useCalibration(): CalibrationController {
  const [screen, setScreen] = useState<ScreenInfo | null>(null);
  const [state, setState] = useState<CalibrationState>(LOADING_STATE);

  useEffect(() => {
    /** Reads the screen and the stored calibration. */
    const sync = (): void => {
      const now: ScreenInfo = {
        widthPx: window.screen.width,
        heightPx: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
      };
      setScreen(now);
      setState(readCalibration(now));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const save = useCallback((calibration: ProjectorCalibration): boolean => {
    const stored = writeCalibration(calibration);
    if (stored) setState({ status: "ok", calibration });
    return stored;
  }, []);

  return { state, screen, save };
}
