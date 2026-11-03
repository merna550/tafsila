/** Turns stored chat messages into the items the panel draws (FR-CHAT-01, FR-CHAT-03, FR-CHAT-04). */
import type { ChatMessage } from "@tafsila/schemas";

/** UI language of a bilingual text. */
export type ChatLocale = "ar" | "en";

/** A message the user sent. */
export interface UserItem {
  readonly kind: "user";
  /** Message id. */
  readonly id: string;
  /** What the user wrote. */
  readonly text: string;
}

/** A plain assistant answer. */
export interface AssistantItem {
  readonly kind: "assistant";
  /** Message id. */
  readonly id: string;
  /** The answer. */
  readonly text: string;
}

/** A valid change the user may apply. */
export interface ProposalItem {
  readonly kind: "proposal";
  /** Message id; the apply route takes it. */
  readonly id: string;
  /** Change lines in the UI language. */
  readonly lines: readonly string[];
  /** The version the proposal was made on. */
  readonly baseVersionId: string | null;
  /** The version it was applied as, or null while pending. */
  readonly appliedVersionId: string | null;
  /** The user's request that led to it, used by "ask again". */
  readonly request: string;
}

/** A request the engine cannot do. */
export interface UnsupportedItem {
  readonly kind: "unsupported";
  /** Message id. */
  readonly id: string;
  /** The polite explanation in the UI language. */
  readonly text: string;
  /** The closest supported changes in the UI language. */
  readonly closest: readonly string[];
}

/** One thing in the conversation. */
export type ChatItem = UserItem | AssistantItem | ProposalItem | UnsupportedItem;

/**
 * Maps one assistant message to its card.
 *
 * @param message - An assistant message.
 * @param locale - UI language.
 * @param request - The user text just before it.
 * @returns The item.
 */
function assistantItem(message: ChatMessage, locale: ChatLocale, request: string): ChatItem {
  if (message.outcome === "proposal") {
    return {
      kind: "proposal",
      id: message.id,
      lines: message.changes.map((line) => line[locale]),
      baseVersionId: message.baseVersionId,
      appliedVersionId: message.appliedVersionId,
      request,
    };
  }
  if (message.outcome === "unsupported" && message.unsupported) {
    return {
      kind: "unsupported",
      id: message.id,
      text: message.unsupported.text[locale],
      closest: message.unsupported.closest.map((line) => line[locale]),
    };
  }
  return { kind: "assistant", id: message.id, text: message.content };
}

/**
 * Maps the stored history, oldest first, to panel items.
 *
 * @param messages - The history from the API.
 * @param locale - UI language for the bilingual lines.
 * @returns The items in the same order.
 */
export function toChatItems(messages: readonly ChatMessage[], locale: ChatLocale): ChatItem[] {
  const items: ChatItem[] = [];
  let lastUser = "";
  for (const message of messages) {
    if (message.role === "user") {
      lastUser = message.content;
      items.push({ kind: "user", id: message.id, text: message.content });
    } else {
      items.push(assistantItem(message, locale, lastUser));
    }
  }
  return items;
}
