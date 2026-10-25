"use client";
/** Hook that saves the page's inputs as a new version; the server re-runs the engine (ADR-245). */
import {
  savePatternVersionResultSchema,
  type SavePatternVersionInput,
  type SavePatternVersionResult,
} from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { designKeys } from "@/entities/design/design-keys";
import { apiRequest } from "@/shared/api";
import { versionKeys } from "./query-keys";

/** What one save sends. */
export interface SaveVersionVariables {
  /** The design the version belongs to. */
  readonly designId: string;
  /** The inputs: spec, set, ease and options. */
  readonly input: SavePatternVersionInput;
}

/**
 * Saves a version and refreshes the design and the version lists on success.
 *
 * @returns The mutation; its result says whether the server reused the current version.
 */
export function useSaveVersion(): UseMutationResult<SavePatternVersionResult, Error, SaveVersionVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ designId, input }: SaveVersionVariables) =>
      apiRequest(`/designs/${designId}/versions`, {
        method: "POST",
        body: input,
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
