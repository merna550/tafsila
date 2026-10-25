"use client";
/** Hook that creates an empty design of a category; the list of designs is refreshed on success. */
import { designSchema, type Design, type GarmentCategory } from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { designKeys } from "@/entities/design/design-keys";
import { apiRequest } from "@/shared/api";

/**
 * Creates a design with the chosen category.
 *
 * @returns The mutation; its result is the new design.
 */
export function useCreateDesign(): UseMutationResult<Design, Error, GarmentCategory> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: GarmentCategory) =>
      apiRequest("/designs", { method: "POST", body: { category }, schema: designSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designKeys.all }),
  });
}
