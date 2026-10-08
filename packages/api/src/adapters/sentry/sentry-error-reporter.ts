/** Sentry adapter for the ErrorReporter port; the only API file that imports the Sentry Node SDK. */
import * as Sentry from "@sentry/node";
import { SENTRY_PRIVACY_OPTIONS } from "@tafsila/utils";
import type { ErrorReporter } from "../../ports/error-reporter";

/** Settings the adapter needs from the build information and configuration. */
export interface SentryReporterOptions {
  /** Sentry DSN. */
  readonly dsn: string;
  /** Deployment environment name. */
  readonly environment: string;
  /** Release identifier (git SHA). */
  readonly release: string;
}

/**
 * Creates the Sentry reporter. Initialises the SDK only when Next's instrumentation has not already
 * done it, so one Sentry client and scope serves the whole process.
 *
 * @param options - DSN, environment and release.
 * @returns A reporter that tags every error with the request id.
 */
export function createSentryErrorReporter(options: SentryReporterOptions): ErrorReporter {
  if (!Sentry.getClient()) {
    Sentry.init({
      dsn: options.dsn,
      environment: options.environment,
      release: options.release,
      ...SENTRY_PRIVACY_OPTIONS,
    });
  }
  return {
    captureException(error, context) {
      Sentry.withScope((scope) => {
        scope.setTag("request_id", context.requestId);
        Sentry.captureException(error);
      });
    },
    setUser(id) {
      Sentry.setUser(id === null ? null : { id });
    },
  };
}
