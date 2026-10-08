/** Browser error tracking: Sentry client init with the privacy scrubber. */
import * as Sentry from "@sentry/nextjs";
import type { PublicConfig } from "@tafsila/config";
import { SENTRY_PRIVACY_OPTIONS } from "@tafsila/utils";

/**
 * Starts Sentry in the browser; does nothing without a DSN or when already started.
 *
 * @param config - Public runtime configuration.
 */
export function initMonitoring(config: Pick<PublicConfig, "sentryDsn" | "appEnv" | "release">): void {
  if (!config.sentryDsn || Sentry.getClient()) return;
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.appEnv,
    release: config.release,
    ...SENTRY_PRIVACY_OPTIONS,
  });
}
