"use client";
/** Hook that deletes a design with its versions; the cached design lists are refreshed on success. */
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/shared/api";
import { designKeys } from "../design-keys";

/**
 * Deletes the design whose id is passed to `mutate`.
 *
 * @returns The mutation.
 */
export function useDeleteDesign(): UseMutationResult<undefined, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/designs/${id}`, { method: "DELETE", schema: z.undefined() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designKeys.all }),
  });
}
