"use client";
/** React hook for feature flags, read through the analytics wrapper only. */
import { useEffect, useState } from "react";
import { isFlagEnabled, onFlagsLoaded } from "./analytics";

/**
 * Returns whether a feature flag is on, updating when PostHog finishes loading flags.
 *
 * @param flag - Flag key, e.g. "signups_open".
 * @returns True when the flag is enabled for this visitor.
 */
export function useFeatureFlag(flag: string): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(isFlagEnabled(flag));
    return onFlagsLoaded(() => setEnabled(isFlagEnabled(flag)));
  }, [flag]);
  return enabled;
}
