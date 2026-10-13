"use client";
/** Hook that loads the default size chart once per session. */
import { sizeChartResponseSchema, type SizeChartResponse } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { measurementKeys } from "./query-keys";

/**
 * Loads the default size chart (cached for the whole session: it only changes when an admin edits it).
 *
 * @returns The TanStack query holding the chart.
 */
export function useDefaultSizeChart(): UseQueryResult<SizeChartResponse> {
  return useQuery({
    queryKey: measurementKeys.defaultChart,
    queryFn: ({ signal }) => apiRequest("/size-charts/default", { schema: sizeChartResponseSchema, signal }),
    staleTime: Infinity,
  });
}
