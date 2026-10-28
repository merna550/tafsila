"use client";
/** Hook that turns true when something has been running for longer than a limit (the 4 s "taking longer" hint, issue #318). */
import { useEffect, useState } from "react";

/** After this many ms a calculation counts as slow (ADR-313 soft limit). */
export const SLOW_AFTER_MS = 4000;

/**
 * Tells whether a run has lasted longer than the limit.
 *
 * @param running - True while the run is going; the clock restarts each time it turns true.
 * @param limitMs - The limit in milliseconds.
 * @returns True once the limit passed during this run.
 */
export function useSlowFlag(running: boolean, limitMs: number = SLOW_AFTER_MS): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!running) return undefined;
    const timer = setTimeout(() => setSlow(true), limitMs);
    return () => clearTimeout(timer);
  }, [running, limitMs]);
  return slow;
}
