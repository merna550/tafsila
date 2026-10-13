"use client";
/** Hook that loads the admin overview numbers. */
import { adminStatsSchema, type AdminStats } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { adminUserKeys } from "./query-keys";

/**
 * Loads users, verified phones, sign-ups and clients.
 *
 * @returns The TanStack query.
 */
export function useAdminStats(): UseQueryResult<AdminStats> {
  return useQuery({
    queryKey: adminUserKeys.stats,
    queryFn: ({ signal }) => apiRequest("/admin/stats", { schema: adminStatsSchema, signal }),
  });
}
