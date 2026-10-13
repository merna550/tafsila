"use client";
/** Hook that loads the default size chart as the admin editor reads it (with its last editor and the placeholder flag). */
import { adminSizeChartSchema, type AdminSizeChart } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";

/** Key of the admin view of the default chart. */
export const ADMIN_SIZE_CHART_KEY = ["admin", "size-chart"] as const;

/**
 * Loads the chart; it is always fetched again on a new visit so two admins do not edit stale values.
 *
 * @returns The TanStack query.
 */
export function useAdminSizeChart(): UseQueryResult<AdminSizeChart> {
  return useQuery({
    queryKey: ADMIN_SIZE_CHART_KEY,
    queryFn: ({ signal }) =>
      apiRequest("/admin/size-charts/default", { schema: adminSizeChartSchema, signal }),
    staleTime: 0,
  });
}
