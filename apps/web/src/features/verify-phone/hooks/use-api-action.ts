"use client";
/** Runs one API call from an event handler and reports the outcome as a value, so screens place errors themselves. */
import { useCallback, useState } from "react";
import { ApiError, clientApiError } from "@/shared/api";

/** Outcome of an action: the data, or the normalised error. */
export type ActionResult<R> =
  { readonly ok: true; readonly data: R } | { readonly ok: false; readonly error: ApiError };

/** What a hook built on {@link useApiAction} exposes. */
export interface ApiAction<A, R> {
  /** Runs the call; never throws. */
  readonly run: (argument: A) => Promise<ActionResult<R>>;
  /** True while a call is in flight. */
  readonly pending: boolean;
}

/**
 * Wraps an API call with a pending flag and error normalisation (the call already throws an ApiError).
 *
 * @param call - The call to run, usually `apiRequest` with a schema from `@tafsila/schemas`.
 * @returns `run` and `pending`.
 */
export function useApiAction<A, R>(call: (argument: A) => Promise<R>): ApiAction<A, R> {
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async (argument: A): Promise<ActionResult<R>> => {
      setPending(true);
      try {
        return { ok: true, data: await call(argument) };
      } catch (error) {
        return { ok: false, error: error instanceof ApiError ? error : clientApiError("unknown") };
      } finally {
        setPending(false);
      }
    },
    [call],
  );
  return { run, pending };
}
