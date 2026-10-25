"use client";
/** Hook that reads one saved version with its stored inputs and the server's engine-changed flag. */
import { patternVersionDetailSchema, type PatternVersionDetail } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { versionKeys } from "./query-keys";

/**
 * Loads one version.
 *
 * @param id - Version id.
 * @returns The query holding the version detail.
 */
export function useVersion(id: string): UseQueryResult<PatternVersionDetail> {
  return useQuery({
    queryKey: versionKeys.one(id),
    queryFn: ({ signal }) => apiRequest(`/versions/${id}`, { schema: patternVersionDetailSchema, signal }),
  });
}
