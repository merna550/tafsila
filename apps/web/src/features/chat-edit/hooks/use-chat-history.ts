"use client";
/** Hook that loads the chat history of a design with the message quota. */
import { chatHistorySchema, type ChatHistory } from "@tafsila/schemas";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api";
import { chatKeys } from "./query-keys";

/**
 * Loads the history, newest last.
 *
 * @param designId - Design id.
 * @param enabled - False while the design has no saved version (nothing to ask the API yet).
 * @returns The TanStack query.
 */
export function useChatHistory(designId: string, enabled: boolean): UseQueryResult<ChatHistory> {
  return useQuery({
    queryKey: chatKeys.history(designId),
    enabled,
    queryFn: ({ signal }) => apiRequest(`/designs/${designId}/chat`, { schema: chatHistorySchema, signal }),
  });
}
