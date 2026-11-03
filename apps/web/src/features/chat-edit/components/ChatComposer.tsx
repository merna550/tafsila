/** The message box: a textarea with a character counter, Send, and a reason when it is off (FR-CHAT-01, FR-CHAT-06). */
import { MAX_CHAT_MESSAGE_LENGTH } from "@tafsila/schemas";
import { Button, Textarea } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { KeyboardEvent, ReactElement } from "react";
import type { ComposeState } from "../model/compose-rules";

/** Props of {@link ChatComposer}. */
interface ChatComposerProps {
  /** The text. */
  readonly text: string;
  /** Called with the new text. */
  readonly onText: (text: string) => void;
  /** What may be done. */
  readonly state: ComposeState;
  /** Sends the text. */
  readonly onSubmit: () => void;
  /** Messages used and allowed. */
  readonly quota: { readonly used: number; readonly limit: number };
}

/**
 * Renders the box. Enter sends, Shift+Enter adds a line; a reason shows when the box is off.
 *
 * @param props - Text, state and handlers.
 * @returns The composer.
 */
export function ChatComposer({
  text,
  onText,
  state,
  onSubmit,
  quota,
}: Readonly<ChatComposerProps>): ReactElement {
  const t = useTranslations("chatEdit.composer");
  const reason = state.block === "busy" ? null : state.block;
  const off = reason !== null;
  /**
   * Sends on Enter unless Shift is held or an input method is composing.
   *
   * @param event - The key press.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onSubmit();
  };
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {reason !== null ? (
        <p role="status" className="text-sm text-warning" data-testid="chat-blocked">
          {t(`blocked.${reason}`, quota)}
        </p>
      ) : null}
      <Textarea
        value={text}
        onChange={(event) => onText(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={off}
        rows={3}
        aria-label={t("label")}
        placeholder={t("placeholder")}
        data-testid="chat-input"
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs ${state.tooLong ? "text-danger" : "text-muted"}`}
          data-testid="chat-counter"
        >
          {t("counter", { n: state.length, max: MAX_CHAT_MESSAGE_LENGTH })}
        </span>
        <Button type="submit" disabled={!state.canSend} data-testid="chat-send">
          {t("send")}
        </Button>
      </div>
    </form>
  );
}
