"use client";
/** Hook that loads one saved measurement set (edit screen). */
import { measurementSetSchema, type MeasurementSet } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { measurementKeys } from "./query-keys";

/**
 * Loads a measurement set; another user's set answers 404 (the screen shows not-found).
 *
 * @param id - Set id; leave out (undefined) to skip loading (the new-set screen).
 * @returns The TanStack query holding the set.
 */
export function useMeasurementSet(id: string | undefined): UseQueryResult<MeasurementSet> {
  return useQuery({
    queryKey: measurementKeys.set(id ?? ""),
    enabled: id !== undefined,
    queryFn: ({ signal }) => apiRequest(`/measurements/${id}`, { schema: measurementSetSchema, signal }),
  });
}
