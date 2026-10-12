/** Privacy scrubber for error-tracking events (NFR-05): removes PII and request payloads before anything leaves the app. */

import { maskPhones } from "./phone";

/** The parts of an error event the scrubber touches (structurally compatible with Sentry events). */
export interface ScrubbableEvent {
  /** Who was affected; only the opaque id may remain. */
  user?: object;
  /** HTTP request data; bodies, cookies and headers are removed. */
  request?: object;
}

/**
 * Keeps only the opaque user id and drops the request body, cookies, headers and query string;
 * anything shaped like an Egyptian mobile number in the kept URL is masked.
 *
 * @param event - Error event about to be sent.
 * @returns The same event, scrubbed.
 * @example
 * scrubEvent({ user: { id: "u1", email: "a@b.c" } }).user; // { id: "u1" }
 */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  if (event.user) {
    const { id } = event.user as { id?: unknown };
    event.user = id === undefined ? undefined : { id };
  }
  if (event.request) {
    const { url, method } = event.request as { url?: unknown; method?: unknown };
    event.request = { url: typeof url === "string" ? maskPhones(url) : url, method };
  }
  return event;
}

/** Sentry SDK options that turn off automatic collection of user info, cookies, headers, bodies and query strings. */
export const SENTRY_PRIVACY_OPTIONS = {
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [] as never[],
    urlQueryParams: false,
  },
  beforeSend: scrubEvent,
};
