"use client";
/** Gives the projector page a usable calibration, or sends the user to calibrate (issue #286). */
import { useEffect } from "react";
import { useRouter } from "@/shared/i18n";
import type { ProjectorCalibration } from "../projector.schema";
import { useCalibration } from "./use-calibration";

/**
 * Reads the calibration of this device; when it is missing or stale, replaces the route with the calibration page.
 *
 * @param calibrateHref - The calibration route of this version.
 * @returns The valid calibration, or null while loading or redirecting.
 */
export function useCalibrationGuard(calibrateHref: string): ProjectorCalibration | null {
  const router = useRouter();
  const { state } = useCalibration();
  useEffect(() => {
    if (state.status === "missing" || state.status === "stale") router.replace(calibrateHref);
  }, [state.status, router, calibrateHref]);
  return state.status === "ok" ? state.calibration : null;
}
