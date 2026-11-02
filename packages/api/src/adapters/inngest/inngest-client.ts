/** Builds the Inngest client from configuration (ADR-012). No request is sent until an event is sent or a run arrives. */
import type { JobsConfig } from "@tafsila/config";
import { Inngest } from "inngest";

/** Environments that talk to Inngest Cloud; every other one uses the local dev server. */
const CLOUD_ENVS = ["staging", "production"];

/**
 * Creates the Inngest client for the API.
 *
 * @param config - Jobs configuration (keys and environment).
 * @returns The client; in dev mode it needs no keys.
 */
export function createInngestClient(config: JobsConfig): Inngest {
  return new Inngest({
    id: "tafsila",
    isDev: !CLOUD_ENVS.includes(config.appEnv),
    eventKey: config.inngestEventKey,
    signingKey: config.inngestSigningKey,
  });
}
