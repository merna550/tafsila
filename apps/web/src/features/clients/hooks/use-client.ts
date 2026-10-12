"use client";
/** Hook that loads one client by id. */
import { clientSchema, type Client } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { clientKeys } from "./query-keys";

/**
 * Loads one client; a client of another user answers NOT_FOUND like a missing one.
 *
 * @param id - Client id.
 * @returns The TanStack query.
 */
export function useClient(id: string): UseQueryResult<Client> {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: ({ signal }) => apiRequest(`/clients/${id}`, { schema: clientSchema, signal }),
  });
}
