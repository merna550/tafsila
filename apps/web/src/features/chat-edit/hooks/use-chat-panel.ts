"use client";
/** Hook behind the chat panel: history, sending, applying and the small local states around them. */
import type { PatternVersion } from "@tafsila/schemas";
import { useLocale } from "next-intl";
import { applyStateOf, type ApplyState } from "../model/apply-state";
import { toChatItems, type ChatItem, type ChatLocale } from "../model/chat-view";
import { composeState, type ComposeState } from "../model/compose-rules";
import { useApplyAction } from "./use-apply-action";
import { useChatHistory } from "./use-chat-history";
import { useSendAction } from "./use-send-action";

/** What the panel draws and does. */
export interface ChatPanelModel {
  /** The conversation, oldest first. */
  readonly items: readonly ChatItem[];
  /** True while the history loads for the first time. */
  readonly loading: boolean;
  /** True when the history could not be loaded. */
  readonly failed: boolean;
  /** Reloads the history. */
  readonly retry: () => void;
  /** The text the user is sending now, or null. */
  readonly sending: string | null;
  /** The composer's text. */
  readonly text: string;
  /** Replaces the composer's text. */
  readonly setText: (text: string) => void;
  /** What the composer may do. */
  readonly compose: ComposeState;
  /** Messages used and allowed for this design. */
  readonly quota: { readonly used: number; readonly limit: number };
  /** Sends the text in the composer. */
  readonly submit: () => void;
  /** Sends a given text as a new message (a suggestion or "ask again"). */
  readonly sendText: (text: string) => void;
  /** The state of a proposal card. */
  readonly applyState: (item: Extract<ChatItem, { kind: "proposal" }>) => ApplyState;
  /** Applies a proposal. */
  readonly apply: (messageId: string) => void;
  /** Hides a proposal without applying it. */
  readonly dismiss: (messageId: string) => void;
  /** True when the proposal was dismissed. */
  readonly isDismissed: (messageId: string) => boolean;
}

/** Messages allowed per design until the history says otherwise. */
const DEFAULT_LIMIT = 10;

/**
 * Wires the chat of one design.
 *
 * @param designId - The design.
 * @param versionId - The saved version the pattern page shows, or null before the first save.
 * @param onApplied - Called with the new version after a proposal was applied.
 * @returns Everything the panel draws and does.
 */
export function useChatPanel(
  designId: string,
  versionId: string | null,
  onApplied: (version: PatternVersion) => void,
): ChatPanelModel {
  const locale = useLocale() as ChatLocale;
  const history = useChatHistory(designId, versionId !== null);
  const send = useSendAction(designId, versionId);
  const applying = useApplyAction(designId, onApplied);
  const quota = { used: history.data?.used ?? 0, limit: history.data?.limit ?? DEFAULT_LIMIT };
  const compose = composeState({
    text: send.text,
    ...quota,
    hasVersion: versionId !== null,
    dailyLimited: send.dailyLimited,
    busy: send.sending !== null,
  });
  return {
    items: toChatItems(history.data?.items ?? [], locale),
    loading: history.isPending && versionId !== null,
    failed: history.isError,
    retry: () => void history.refetch(),
    sending: send.sending,
    text: send.text,
    setText: send.setText,
    compose,
    quota,
    submit: () => compose.canSend && send.sendText(send.text.trim()),
    sendText: send.sendText,
    applyState: (item) => applyStateOf(item, applying.local[item.id], versionId),
    apply: applying.apply,
    dismiss: applying.dismiss,
    isDismissed: applying.isDismissed,
  };
}
