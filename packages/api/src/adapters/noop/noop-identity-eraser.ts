/** No-op identity eraser used when the PostHog erasure credentials are not configured (local, CI, staging without a key). */
import type { IdentityEraser } from "../../ports/identity-eraser";

/**
 * Creates an eraser that only logs one warning per call, so a missing key never blocks account deletion.
 *
 * @param warn - Where the warning goes (defaults to the console as one JSON line; tests pass a spy).
 * @returns An IdentityEraser with no network access.
 */
export function createNoopIdentityEraser(
  warn: (line: string) => void = (line) => console.warn(line),
): IdentityEraser {
  return {
    erase: () => {
      warn(
        JSON.stringify({
          level: "warn",
          message: "POSTHOG_PERSONAL_API_KEY is not set: the person was not erased at PostHog",
        }),
      );
      return Promise.resolve();
    },
  };
}
