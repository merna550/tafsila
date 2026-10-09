/** The single typed API client of the web app: the only place that calls `fetch` (ADR-029, ADR-030). */
import { apiErrorBodySchema } from "@tafsila/schemas";
import type { ZodType } from "zod";
import { apiErrorFromBody, clientApiError, type ApiError } from "./api-error";

/** Default time before a request is given up, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 15_000;

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
  const timeout = AbortSignal.timeout(timeoutMs);
  let response: Response;
  try {
    response = await fetchFn(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
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
