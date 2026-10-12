"use client";
/** Hook that follows a fast-changing value after it has been still for a moment (search boxes). */
import { useEffect, useState } from "react";

/** Default wait before the value is passed on, in milliseconds. */
export const DEBOUNCE_MS = 300;

/**
 * Returns `value` after it stopped changing for `delayMs`.
 *
 * @param value - The live value, for example what the user typed.
 * @param delayMs - How long the value must stay the same.
 * @returns The settled value.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = DEBOUNCE_MS): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
