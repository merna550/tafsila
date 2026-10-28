"use client";
/** Hook that reads the last saved fabric calculation of a version; "nothing saved yet" is a null, not an error (issue #318). */
import { fabricCalcSchema, type FabricCalc } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { ApiError, apiRequest } from "@/shared/api";
import { fabricKeys } from "./query-keys";

/** HTTP status of "no saved calculation". */
const NOT_FOUND = 404;

/**
 * Loads the saved calculation of one version.
 *
 * @param versionId - Version id.
 * @returns The query; `data` is null when nothing was saved.
 */
export function useSavedFabricCalc(versionId: string): UseQueryResult<FabricCalc | null> {
  return useQuery({
    queryKey: fabricKeys.calc(versionId),
    queryFn: async ({ signal }) => {
      try {
        return await apiRequest(`/versions/${versionId}/fabric`, { schema: fabricCalcSchema, signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === NOT_FOUND) return null;
        throw error;
      }
    },
  });
}
