/** The single typed API client of the web app: the only place that calls `fetch` (ADR-029, ADR-030). */
import { apiErrorBodySchema } from "@tafsila/schemas";
import type { ZodType } from "zod";
import { apiErrorFromBody, clientApiError, type ApiError } from "./api-error";

/** Default time before a request is given up, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Returns the current access token, or null when signed out. */
export type AccessTokenGetter = () => Promise<string | null>;

let accessTokenGetter: AccessTokenGetter | null = null;

/**
 * Registers how API calls find the access token. `shared/auth` calls this, so this module never imports Supabase.
 *
 * @param getter - The token source, or null to remove it.
 */
export function setAccessTokenGetter(getter: AccessTokenGetter | null): void {
  accessTokenGetter = getter;
}

/**
 * Builds the request headers: JSON content type when there is a body, and the bearer token when signed in.
 *
 * @param hasBody - Whether the request carries a JSON body.
 * @param getToken - Token source.
 * @returns The headers, or undefined when there are none.
 */
async function buildHeaders(
  hasBody: boolean,
  getToken: AccessTokenGetter | null,
): Promise<Record<string, string> | undefined> {
  const headers: Record<string, string> = hasBody ? { "content-type": "application/json" } : {};
  const token = getToken ? await getToken().catch(() => null) : null;
  if (token) headers.authorization = `Bearer ${token}`;
  return Object.keys(headers).length > 0 ? headers : undefined;
}

/** Options of one API call. */
export interface ApiRequestOptions<T> {
  /** HTTP method; defaults to GET. */
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body, if any. */
  readonly body?: unknown;
  /** Schema from `@tafsila/schemas` that the response must match. */
  readonly schema: ZodType<T>;
  /** Timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Caller cancellation (for example when a query is cancelled). */
  readonly signal?: AbortSignal;
  /** Replaceable token source, used by tests; defaults to the one registered by `shared/auth`. */
  readonly getToken?: AccessTokenGetter | null;
  /** Replaceable fetch, used by tests. */
  readonly fetchFn?: typeof fetch;
}

/**
 * Reads a failed response into an ApiError; a body that is not the standard shape becomes a generic error.
 *
 * @param response - A non-2xx response.
 * @returns The normalised error.
 */
async function errorFromResponse(response: Response): Promise<ApiError> {
  try {
    return apiErrorFromBody(apiErrorBodySchema.parse(await response.json()), response.status);
  } catch {
    return clientApiError("unknown", response.status);
  }
}

/**
 * Turns a thrown fetch failure into an ApiError.
 *
 * @param error - What `fetch` threw.
 * @returns A timeout error for aborts and timeouts, otherwise a network error.
 */
function errorFromFailure(error: unknown): ApiError {
  const isTimeout =
    error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
  return clientApiError(isTimeout ? "timeout" : "network");
}

/**
 * Calls the API and returns the parsed response; every failure is thrown as an ApiError.
 *
 * @param path - Path under /api, for example "/health".
 * @param options - Method, body, response schema and limits.
 * @returns The response body parsed by `options.schema`.
 * @throws {ApiError} For non-2xx responses, network failures, timeouts and unexpected response shapes.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions<T>): Promise<T> {
  const { method = "GET", body, schema, timeoutMs = DEFAULT_TIMEOUT_MS, signal, fetchFn = fetch } = options;
  const getToken = options.getToken === undefined ? accessTokenGetter : options.getToken;
  const timeout = AbortSignal.timeout(timeoutMs);
  let response: Response;
  try {
    response = await fetchFn(`/api${path}`, {
      method,
      headers: await buildHeaders(body !== undefined, getToken),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    throw errorFromFailure(error);
  }
  if (!response.ok) throw await errorFromResponse(response);
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) throw clientApiError("unknown", response.status);
  return parsed.data;
}
