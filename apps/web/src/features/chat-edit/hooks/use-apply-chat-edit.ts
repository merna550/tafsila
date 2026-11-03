"use client";
/** Hook that applies a proposal: the server saves a new version made by chat. */
import { savePatternVersionResultSchema, type SavePatternVersionResult } from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { designKeys } from "@/entities/design/design-keys";
import { versionKeys } from "@/features/pattern-versions";
import { apiRequest } from "@/shared/api";
import { chatKeys } from "./query-keys";

/** What one apply carries. */
export interface ApplyChatVariables {
  /** The design. */
  readonly designId: string;
  /** The assistant message holding the proposal. */
  readonly messageId: string;
}

/**
 * Applies a proposal and refreshes the history, the design and the version lists.
 *
 * @returns The mutation; its result carries the new version.
 */
export function useApplyChatEdit(): UseMutationResult<SavePatternVersionResult, Error, ApplyChatVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ designId, messageId }: ApplyChatVariables) =>
      apiRequest(`/designs/${designId}/chat/${messageId}/apply`, {
        method: "POST",
        schema: savePatternVersionResultSchema,
      }),
    onSettled: async (_result, _error, { designId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatKeys.history(designId) }),
        queryClient.invalidateQueries({ queryKey: versionKeys.all }),
        queryClient.invalidateQueries({ queryKey: designKeys.detail(designId) }),
        queryClient.invalidateQueries({ queryKey: designKeys.all }),
      ]);
    },
  });
}
