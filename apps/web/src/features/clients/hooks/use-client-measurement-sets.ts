"use client";
/** Hook that loads a client's measurement sets, newest first. */
import { measurementSetPageSchema, type MeasurementSet, type Page } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { clientKeys } from "./query-keys";

/** Most sets shown on a profile; a client rarely has more. */
const SETS_LIMIT = 100;

/**
 * Loads the measurement sets saved for a client.
 *
 * @param clientId - Client id; null waits (no request) until a client is chosen.
 * @returns The TanStack query holding one page of sets.
 */
export function useClientMeasurementSets(clientId: string | null): UseQueryResult<Page<MeasurementSet>> {
  return useQuery({
    queryKey: clientKeys.sets(clientId ?? ""),
    enabled: clientId !== null,
    queryFn: ({ signal }) =>
      apiRequest("/measurements", {
        schema: measurementSetPageSchema,
        signal,
        query: { clientId: clientId ?? undefined, limit: SETS_LIMIT, offset: 0 },
      }),
  });
}
