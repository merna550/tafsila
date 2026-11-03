"use client";
/** Hook that sends chat messages: the composer text, the message on its way and the refusal by the daily limit. */
import { useState } from "react";
import { toApiError, useApiErrorHandler } from "@/shared/error-display";
import { useSendChatMessage } from "./use-send-chat-message";

/** What the panel uses to send. */
export interface SendAction {
  /** The composer's text. */
  readonly text: string;
  /** Replaces the composer's text. */
  readonly setText: (text: string) => void;
  /** The message on its way, or null. */
  readonly sending: string | null;
  /** True after the server said today's limit was reached. */
  readonly dailyLimited: boolean;
  /** Sends a text as a new message on the current version. */
  readonly sendText: (message: string) => void;
}

/**
 * Wires sending. The quota refusal is not toasted: the box turns itself off with the reason.
 *
 * @param designId - The design.
 * @param versionId - The saved version the request is about, or null.
 * @returns The state and the sender.
 */
export function useSendAction(designId: string, versionId: string | null): SendAction {
  const handleError = useApiErrorHandler();
  const send = useSendChatMessage();
  const [text, setText] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [dailyLimited, setDailyLimited] = useState(false);

  /**
   * Sends a text and keeps it in view while the answer is on its way.
   *
   * @param message - The text to send.
   */
  const sendText = (message: string): void => {
    if (versionId === null || sending !== null) return;
    setSending(message);
    send.mutate(
      { designId, versionId, message },
      {
        onSuccess: () => setText(""),
        onError: (error) => {
          const code = toApiError(error).code;
          if (code === "CHAT_DAILY_LIMIT") setDailyLimited(true);
          if (code !== "CHAT_QUOTA_EXCEEDED") handleError(error, "action");
        },
        onSettled: () => setSending(null),
      },
    );
  };
  return { text, setText, sending, dailyLimited, sendText };
}
