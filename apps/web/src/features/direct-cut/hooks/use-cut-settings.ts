"use client";
/** The per-viewer curve step of the direct-cut screen, kept in the browser. */
import { useCallback, useEffect, useState } from "react";
import { readJson, writeJson } from "@/shared/storage/safe-storage";
import { CUT_SETTINGS_KEY, DEFAULT_CURVE_STEP_MM, parseCurveStep, type CurveStepMm } from "../model/settings";
import type { CutSettings } from "../model/types";

/**
 * Reads the stored setting after mount (no server/client mismatch) and stores each change.
 *
 * @returns The setting.
 */
export function useCutSettings(): CutSettings {
  const [curveStepMm, setStep] = useState<CurveStepMm>(DEFAULT_CURVE_STEP_MM);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStep(parseCurveStep(readJson(CUT_SETTINGS_KEY)));
    setLoaded(true);
  }, []);

  const setCurveStepMm = useCallback((value: CurveStepMm) => {
    setStep(value);
    writeJson(CUT_SETTINGS_KEY, { curveStepMm: value });
  }, []);

  return { curveStepMm, loaded, setCurveStepMm };
}
