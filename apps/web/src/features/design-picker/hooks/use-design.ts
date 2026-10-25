"use client";
/** Hook that loads one design by id. */
import { designSchema, type Design } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { designKeys } from "@/entities/design/design-keys";
import { apiRequest } from "@/shared/api";

/**
 * Loads one design; a design of another user answers NOT_FOUND like a missing one.
 *
 * @param id - Design id.
 * @returns The TanStack query.
 */
export function useDesign(id: string): UseQueryResult<Design> {
  return useQuery({
    queryKey: designKeys.detail(id),
    queryFn: ({ signal }) => apiRequest(`/designs/${id}`, { schema: designSchema, signal }),
  });
}
