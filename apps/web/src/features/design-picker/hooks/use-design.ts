"use client";
/** Hook that loads one design by id with its current version (the stored spec). */
import { designDetailSchema, type DesignDetail } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { designKeys } from "@/entities/design/design-keys";
import { apiRequest } from "@/shared/api";

/**
 * Loads one design and its current version; a design of another user answers NOT_FOUND like a missing one.
 *
 * @param id - Design id.
 * @returns The TanStack query.
 */
export function useDesign(id: string): UseQueryResult<DesignDetail> {
  return useQuery({
    queryKey: designKeys.detail(id),
    queryFn: ({ signal }) => apiRequest(`/designs/${id}`, { schema: designDetailSchema, signal }),
  });
}
