"use client";
/** Hooks that load the fabric catalogue and the recommendation rules as the admin reads them (with the review flag and last editor). */
import {
  adminFabricListSchema,
  adminFabricRuleListSchema,
  type AdminFabric,
  type AdminFabricRule,
} from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { ADMIN_FABRICS_KEY, ADMIN_RULES_KEY } from "./query-keys";

/**
 * Loads every fabric; always fetched again on a new visit so two admins do not edit stale values.
 *
 * @returns The query, holding the list of fabrics.
 */
export function useAdminFabrics(): UseQueryResult<AdminFabric[]> {
  return useQuery({
    queryKey: ADMIN_FABRICS_KEY,
    staleTime: 0,
    queryFn: async ({ signal }) =>
      (await apiRequest("/admin/fabrics", { schema: adminFabricListSchema, signal })).items,
  });
}

/**
 * Loads every recommendation rule.
 *
 * @returns The query, holding the list of rules.
 */
export function useAdminFabricRules(): UseQueryResult<AdminFabricRule[]> {
  return useQuery({
    queryKey: ADMIN_RULES_KEY,
    staleTime: 0,
    queryFn: async ({ signal }) =>
      (await apiRequest("/admin/fabric-rules", { schema: adminFabricRuleListSchema, signal })).items,
  });
}
