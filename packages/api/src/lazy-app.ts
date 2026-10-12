/** Defers building the API until the first request, so importing the route never reads runtime configuration. */

/** A fetch-style request handler. */
export type FetchHandler = (request: Request) => Response | Promise<Response>;

/**
 * Wraps an app factory so the app is created on the first request and reused afterwards.
 * A factory that throws is retried on the next request (nothing is cached on failure).
 *
 * @param create - Builds an object with a `fetch` handler (for example `createApp`).
 * @returns A handler that creates the app lazily.
 */
export function createLazyFetch(create: () => { fetch: FetchHandler }): FetchHandler {
  let app: { fetch: FetchHandler } | undefined;
  return (request) => {
    app ??= create();
    return app.fetch(request);
  };
}
