"use client";
/** Hook that loads one user for the read-only detail page. */
import { adminUserDetailSchema, type AdminUserDetail } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { adminUserKeys } from "./query-keys";

/**
 * Loads one user.
 *
 * @param id - User id.
 * @returns The TanStack query.
 */
export function useAdminUser(id: string): UseQueryResult<AdminUserDetail> {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: ({ signal }) => apiRequest(`/admin/users/${id}`, { schema: adminUserDetailSchema, signal }),
  });
}
