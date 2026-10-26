"use client";
/** Tick state of one version at one curve step, kept in the browser; works in memory when storage is blocked. */
import { useCallback, useEffect, useState } from "react";
import { readJson, writeJson } from "@/shared/storage/safe-storage";
import { clearTicks, parseTicks, ticksKey, toStoredTicks, toggleTick } from "../model/ticks";
import type { TicksController } from "../model/types";

/**
 * Starts empty (so the server and first client render agree), then reads the stored ticks and writes every change.
 *
 * @param versionId - Version id.
 * @param curveStepMm - Gap between curve points, mm.
 * @param engineVersion - Engine version of the steps on screen, or undefined before they arrive.
 * @returns The ticks and the two actions.
 */
export function useTicks(
  versionId: string,
  curveStepMm: number,
  engineVersion: string | undefined,
): TicksController {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (engineVersion === undefined) return;
    setTicked(parseTicks(readJson(ticksKey(versionId, curveStepMm)), engineVersion));
  }, [versionId, curveStepMm, engineVersion]);

  const update = useCallback(
    (change: (current: ReadonlySet<string>) => ReadonlySet<string>) => {
      if (engineVersion === undefined) return;
      setTicked((current) => {
        const next = change(current);
        writeJson(ticksKey(versionId, curveStepMm), toStoredTicks(engineVersion, next));
        return next;
      });
    },
    [versionId, curveStepMm, engineVersion],
  );

  return {
    ticked,
    toggle: useCallback((id: string) => update((current) => toggleTick(current, id)), [update]),
    clear: useCallback(() => update(clearTicks), [update]),
  };
}
