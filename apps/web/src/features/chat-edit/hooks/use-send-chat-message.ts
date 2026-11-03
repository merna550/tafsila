"use client";
/** Hook that sends one edit request; the answer arrives with the refreshed history. */
import { sendChatMessageResultSchema, type SendChatMessageResult } from "@tafsila/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { chatKeys } from "./query-keys";

/** What one send carries. */
export interface SendChatVariables {
  /** The design. */
  readonly designId: string;
  /** The version the request is about. */
  readonly versionId: string;
  /** The user's text. */
  readonly message: string;
}

/**
 * Sends a message and refreshes the history afterwards, also after a refusal (the quota may have changed).
 *
 * @returns The mutation.
 */
export function useSendChatMessage(): UseMutationResult<SendChatMessageResult, Error, SendChatVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ designId, versionId, message }: SendChatVariables) =>
      apiRequest(`/designs/${designId}/chat`, {
        method: "POST",
        body: { message, versionId },
        schema: sendChatMessageResultSchema,
      }),
    onSettled: (_result, _error, { designId }) =>
      queryClient.invalidateQueries({ queryKey: chatKeys.history(designId) }),
  });
}
