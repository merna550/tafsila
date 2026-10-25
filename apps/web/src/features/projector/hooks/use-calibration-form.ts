"use client";
/** The two typed sizes of the calibration form, their errors and the submit that stores the result (issue #285). */
import { useState } from "react";
import { calibrationFrom, nominalSquarePx } from "../model/calibration";
import type { CalibrationErrorKey, CalibrationFormController } from "../model/controllers";
import type { ProjectorCalibration, ScreenInfo } from "../projector.schema";

/**
 * Holds the form of the calibration screen.
 *
 * @param screen - The screen now, or null before mount.
 * @param save - Stores a calibration; false when storage refused.
 * @returns The texts, the errors and the submit.
 */
export function useCalibrationForm(
  screen: ScreenInfo | null,
  save: (calibration: ProjectorCalibration) => boolean,
): CalibrationFormController {
  const [width, setWidthText] = useState("");
  const [height, setHeightText] = useState("");
  const [widthError, setWidthError] = useState<CalibrationErrorKey | null>(null);
  const [heightError, setHeightError] = useState<CalibrationErrorKey | null>(null);
  const [storageError, setStorageError] = useState(false);

  /**
   * Computes the calibration from the typed texts and stores it.
   *
   * @returns True when it was stored.
   */
  const submit = (): boolean => {
    if (screen === null) return false;
    const result = calibrationFrom(nominalSquarePx(screen), { width, height }, screen);
    setWidthError(!result.ok && result.field === "width" ? result.reason : null);
    setHeightError(!result.ok && result.field === "height" ? result.reason : null);
    if (!result.ok) return false;
    const stored = save(result.calibration);
    setStorageError(!stored);
    return stored;
  };

  return {
    width,
    height,
    setWidth: (text) => {
      setWidthText(text);
      setWidthError(null);
    },
    setHeight: (text) => {
      setHeightText(text);
      setHeightError(null);
    },
    widthError,
    heightError,
    storageError,
    submit,
  };
}
