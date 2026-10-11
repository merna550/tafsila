/** Composition root: the only place that chooses which adapter implements each port (ADR-006). */
import { loadBuildInfo, loadPublicConfig, type BuildInfo } from "@tafsila/config";
import { createNoopAnalytics } from "./adapters/noop/noop-analytics";
import { createNoopErrorReporter } from "./adapters/noop/noop-error-reporter";
import {
  createRejectingTokenVerifier,
  createJwksTokenVerifier,
} from "./adapters/supabase/jwks-token-verifier";
import { createPosthogAnalytics } from "./adapters/posthog/posthog-analytics";
import { createSentryErrorReporter } from "./adapters/sentry/sentry-error-reporter";
import { createSystemClock } from "./adapters/system/system-clock";
import type { Analytics } from "./ports/analytics";
import type { Clock } from "./ports/clock";
import type { ErrorReporter } from "./ports/error-reporter";
import type { TokenVerifier } from "./ports/token-verifier";

/** Build information reported by the health endpoint. */
export type AppInfo = BuildInfo;

/** Everything the routes and services need, wired once per process. */
export interface Container {
  /** Time source. */
  readonly clock: Clock;
  /** Build information. */
  readonly appInfo: AppInfo;
  /** Where unexpected errors are reported. */
  readonly errorReporter: ErrorReporter;
  /** Where server-side product events go. */
  readonly analytics: Analytics;
  /** Verifies Supabase access tokens for protected routes. */
  readonly tokenVerifier: TokenVerifier;
}

/**
 * Chooses the token verifier: the project's JWKS when SUPABASE_URL is set, otherwise one that rejects everything.
 *
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The token verifier for this environment.
 */
export function createTokenVerifier(source: Record<string, string | undefined> = process.env): TokenVerifier {
  const { supabaseUrl } = loadPublicConfig(source);
  return supabaseUrl ? createJwksTokenVerifier({ supabaseUrl }) : createRejectingTokenVerifier();
}

/**
 * Chooses the real or no-op observability adapters from the configuration keys.
 *
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The error reporter and analytics for this environment.
 */
export function createObservability(
  source: Record<string, string | undefined> = process.env,
): Pick<Container, "errorReporter" | "analytics"> {
  const config = loadPublicConfig(source);
  return {
    errorReporter: config.sentryDsn
      ? createSentryErrorReporter({
          dsn: config.sentryDsn,
          environment: config.appEnv,
          release: config.release,
        })
      : createNoopErrorReporter(),
    analytics: config.posthogKey
      ? createPosthogAnalytics(config.posthogKey, config.posthogHost)
      : createNoopAnalytics(),
  };
}

/**
 * Wires real adapters for the running environment; tests pass overrides with fakes.
 *
 * @param overrides - Ports to replace (e.g. a fixed clock in tests).
 * @returns The dependency container.
 */
export function createContainer(overrides: Partial<Container> = {}): Container {
  return {
    clock: createSystemClock(),
    appInfo: loadBuildInfo(),
    ...createObservability(),
    tokenVerifier: createTokenVerifier(),
    ...overrides,
  };
}
