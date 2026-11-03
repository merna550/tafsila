/** One chat bubble: the user's request or a plain assistant answer. */
import type { ReactElement } from "react";

/** Props of {@link MessageBubble}. */
interface MessageBubbleProps {
  /** Who wrote it. */
  readonly role: "user" | "assistant";
  /** The text. */
  readonly text: string;
}

/**
 * Renders a bubble; the user's sits at the start edge in the primary tint, the assistant's is plain.
 *
 * @param props - Role and text.
 * @returns The bubble.
 */
export function MessageBubble({ role, text }: Readonly<MessageBubbleProps>): ReactElement {
  const own = role === "user";
  return (
    <p
      data-testid={`chat-${role}`}
      className={`w-fit max-w-full whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm ${
        own ? "self-start bg-primary/10 text-text" : "self-end border border-border bg-surface text-text"
      }`}
    >
      {text}
    </p>
  );
}
