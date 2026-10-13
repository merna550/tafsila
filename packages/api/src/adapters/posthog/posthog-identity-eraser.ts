/** PostHog adapter for the IdentityEraser port: deletes the person whose distinct id is the user id (NFR-05). */
import type { IdentityEraser } from "../../ports/identity-eraser";

/** What the adapter needs to reach the PostHog private API. */
export interface PosthogEraserConfig {
  readonly host: string;
  readonly personalApiKey: string;
  readonly projectId: string;
  /** Replaceable in tests. */
  readonly fetchImpl?: typeof fetch;
}

/** HTTP status for "no such person": nothing to erase, so success. */
const HTTP_NOT_FOUND = 404;

/**
 * Creates the eraser. It looks the person up by distinct id, then deletes the person together with their events.
 *
 * @param config - Host, personal API key, project id and optional fetch.
 * @returns An IdentityEraser backed by PostHog.
 */
export function createPosthogIdentityEraser(config: PosthogEraserConfig): IdentityEraser {
  const doFetch = config.fetchImpl ?? fetch;
  const base = `${config.host.replace(/\/$/, "")}/api/projects/${encodeURIComponent(config.projectId)}/persons`;
  const headers = { authorization: `Bearer ${config.personalApiKey}`, "content-type": "application/json" };
  return {
    async erase(userId) {
      const lookup = await doFetch(`${base}/?distinct_id=${encodeURIComponent(userId)}`, { headers });
      if (!lookup.ok) throw new Error(`PostHog person lookup failed with ${lookup.status}`);
      const found = (await lookup.json()) as { results?: { id?: number | string }[] };
      const personId = found.results?.[0]?.id;
      if (personId === undefined) return;
      const response = await doFetch(`${base}/${encodeURIComponent(String(personId))}/?delete_events=true`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok && response.status !== HTTP_NOT_FOUND) {
        throw new Error(`PostHog person delete failed with ${response.status}`);
      }
    },
  };
}
