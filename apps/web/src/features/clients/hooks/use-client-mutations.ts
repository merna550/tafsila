"use client";
/** Hooks that create, update and delete a client; each refreshes the cached lists and profiles when it succeeds. */
import { clientSchema, type Client } from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/shared/api";
import { toCreateBody, toUpdateBody, type ClientFormValues } from "../model/client-form.schema";
import { clientKeys } from "./query-keys";

/**
 * Returns a function that marks every cached client list and profile as stale.
 *
 * @param refetchType - "active" refetches what is on screen; "inactive" leaves it alone (a deleted client's profile).
 * @returns The invalidation function.
 */
function useInvalidateClients(refetchType: "active" | "inactive" = "active"): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: clientKeys.all, refetchType });
}

/**
 * Creates a client from the dialog's values.
 *
 * @returns The mutation; its result is the new client.
 */
export function useCreateClient(): UseMutationResult<Client, Error, ClientFormValues> {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (values: ClientFormValues) =>
      apiRequest("/clients", { method: "POST", body: toCreateBody(values), schema: clientSchema }),
    onSuccess: invalidate,
  });
}

/**
 * Changes a client's name and notes.
 *
 * @param id - Client id.
 * @returns The mutation; its result is the updated client.
 */
export function useUpdateClient(id: string): UseMutationResult<Client, Error, ClientFormValues> {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (values: ClientFormValues) =>
      apiRequest(`/clients/${id}`, { method: "PATCH", body: toUpdateBody(values), schema: clientSchema }),
    onSuccess: invalidate,
  });
}

/**
 * Deletes a client together with her measurement sets.
 *
 * @param id - Client id.
 * @returns The mutation.
 */
export function useDeleteClient(id: string): UseMutationResult<undefined, Error, void> {
  const invalidate = useInvalidateClients("inactive");
  return useMutation({
    mutationFn: () => apiRequest(`/clients/${id}`, { method: "DELETE", schema: z.undefined() }),
    onSuccess: invalidate,
  });
}
