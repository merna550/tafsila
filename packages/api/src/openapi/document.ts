/** Builds the OpenAPI document from the real routes, with every dependency fixed so the output is byte-stable. */
import { createNoopAnalytics } from "../adapters/noop/noop-analytics";
import { createNoopErrorReporter } from "../adapters/noop/noop-error-reporter";
import { createRejectingTokenVerifier } from "../adapters/supabase/jwks-token-verifier";
import { createApp } from "../app";
import type { Container } from "../container";
import { OPENAPI_DOCUMENT_CONFIG } from "./document-config";

/** Container used only to read the route definitions; nothing is ever called. */
const DOCUMENT_CONTAINER: Container = {
  clock: { now: () => new Date(0) },
  appInfo: { environment: "local", version: "dev", gitSha: "unknown" },
  errorReporter: createNoopErrorReporter(),
  analytics: createNoopAnalytics(),
  tokenVerifier: createRejectingTokenVerifier(),
};

/**
 * Builds the OpenAPI 3.1 document of the whole API.
 *
 * @returns The document object.
 */
export function buildOpenApiDocument(): object {
  return createApp(DOCUMENT_CONTAINER).getOpenAPI31Document(OPENAPI_DOCUMENT_CONFIG);
}

/**
 * Serialises the document exactly as it is committed.
 *
 * @returns Pretty-printed JSON ending with a newline.
 */
export function renderOpenApiDocument(): string {
  return JSON.stringify(buildOpenApiDocument(), null, 2) + "\n";
}
