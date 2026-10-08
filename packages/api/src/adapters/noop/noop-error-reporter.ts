/** No-op error reporter used when no Sentry DSN is configured (local, CI, previews). */
import type { ErrorReporter } from "../../ports/error-reporter";

/**
 * Creates a reporter that ignores everything.
 *
 * @returns A reporter with no side effects.
 */
export function createNoopErrorReporter(): ErrorReporter {
  return { captureException: () => undefined, setUser: () => undefined };
}
