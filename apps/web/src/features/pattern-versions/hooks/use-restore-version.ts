"use client";
/** Hook that restores an old version as a new one (the server appends version n+1; history is never rewritten). */
import { savePatternVersionResultSchema, type SavePatternVersionResult } from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { designKeys } from "@/entities/design/design-keys";
import { apiRequest } from "@/shared/api";
import { versionKeys } from "./query-keys";

/** What one restore sends. */
export interface RestoreVersionVariables {
  /** The version to copy. */
  readonly versionId: string;
  /** The design it belongs to (to refresh it). */
  readonly designId: string;
}

/**
 * Restores a version and refreshes the design and the version lists on success.
 *
 * @returns The mutation; its result carries the version the server answered with.
 */
export function useRestoreVersion(): UseMutationResult<
  SavePatternVersionResult,
  Error,
  RestoreVersionVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId }: RestoreVersionVariables) =>
      apiRequest(`/versions/${versionId}/restore`, {
        method: "POST",
        schema: savePatternVersionResultSchema,
      }),
    onSuccess: async (_result, { designId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: versionKeys.all }),
        queryClient.invalidateQueries({ queryKey: designKeys.detail(designId) }),
        queryClient.invalidateQueries({ queryKey: designKeys.all }),
      ]);
    },
  });
}
