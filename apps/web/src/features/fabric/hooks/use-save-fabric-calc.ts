"use client";
/** Hook that saves a finished calculation; the last save of a version and its options wins (issue #318, #317). */
import { fabricCalcSchema, type FabricCalc, type SaveFabricCalcInput } from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { fabricKeys } from "./query-keys";

/**
 * Saves a calculation and puts the stored row in the cache.
 *
 * @param versionId - Version id.
 * @returns The mutation.
 */
export function useSaveFabricCalc(
  versionId: string,
): UseMutationResult<FabricCalc, Error, SaveFabricCalcInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveFabricCalcInput) =>
      apiRequest(`/versions/${versionId}/fabric`, { method: "PUT", body, schema: fabricCalcSchema }),
    onSuccess: (calc) => {
      queryClient.setQueryData(fabricKeys.calc(versionId), calc);
    },
  });
}
