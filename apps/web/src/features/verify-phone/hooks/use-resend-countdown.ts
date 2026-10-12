"use client";
/** Application hook: the "resend after 0:42" countdown, driven by what the API says (resendAfterSeconds, Retry-After). */
import { useCallback, useEffect, useState } from "react";
import { secondsLeft } from "../model/countdown";

/** Milliseconds between two ticks of the displayed clock. */
const TICK_MS = 1000;
/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;

/** What the screen reads and calls. */
export interface ResendCountdown {
  /** Whole seconds until a new code may be requested; 0 means now. */
  readonly seconds: number;
  /** Starts (or restarts) the countdown from the number of seconds the API gave. */
  readonly start: (seconds: number) => void;
}

/**
 * Counts down to a deadline, so a background tab that pauses its timer still shows the right time on return.
 *
 * @returns The seconds left and `start`.
 */
export function useResendCountdown(): ResendCountdown {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);
  const start = useCallback((seconds: number) => {
    const startedAt = Date.now();
    setNow(startedAt);
    setDeadline(startedAt + seconds * MS_PER_SECOND);
  }, []);
  return { seconds: deadline === null ? 0 : secondsLeft(deadline, now), start };
}
