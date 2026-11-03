"use client";
/** The chat tab of the pattern page: ask for an edit in words, review the proposal, apply it as a new version (FR-CHAT-01..04, FR-CHAT-06). */
import type { PatternVersion } from "@tafsila/schemas";
import { Button, Spinner } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { ChatComposer } from "./components/ChatComposer";
import { MessageBubble } from "./components/MessageBubble";
import { ProposalCard } from "./components/ProposalCard";
import { UnsupportedCard } from "./components/UnsupportedCard";
import { useChatPanel, type ChatPanelModel } from "./hooks/use-chat-panel";
import type { ChatItem } from "./model/chat-view";

/** Props of {@link ChatPanel}. */
interface ChatPanelProps {
  /** The design. */
  readonly designId: string;
  /** The saved version the page shows, or null before the first save. */
  readonly versionId: string | null;
  /** Called with the new version after a proposal was applied, so the page can reload it. */
  readonly onApplied: (version: PatternVersion) => void;
}

/**
 * Draws one conversation item.
 *
 * @param props - The item, the panel model and the design.
 * @returns The bubble or card.
 */
function Item({
  item,
  model,
  designId,
}: Readonly<{ item: ChatItem; model: ChatPanelModel; designId: string }>): ReactElement {
  if (item.kind === "user" || item.kind === "assistant")
    return <MessageBubble role={item.kind} text={item.text} />;
  if (item.kind === "unsupported") {
    return <UnsupportedCard item={item} onTry={model.sendText} disabled={model.compose.block !== null} />;
  }
  return (
    <ProposalCard
      item={item}
      state={model.applyState(item)}
      dismissed={model.isDismissed(item.id)}
      designId={designId}
      onApply={() => model.apply(item.id)}
      onCancel={() => model.dismiss(item.id)}
      onAskAgain={() => model.sendText(item.request)}
      busy={model.sending !== null}
    />
  );
}

/**
 * The conversation: history in a polite live region, then the composer.
 *
 * @param props - Component props.
 * @returns The panel.
 */
function Conversation({ designId, versionId, onApplied }: Readonly<ChatPanelProps>): ReactElement {
  const t = useTranslations("chatEdit");
  const model = useChatPanel(designId, versionId, onApplied);
  return (
    <div className="flex flex-col gap-3" data-testid="chat-panel">
      <p className="text-sm text-muted" data-testid="chat-remaining">
        {t("remaining", { n: Math.max(0, model.quota.limit - model.quota.used), limit: model.quota.limit })}
      </p>
      {model.failed ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-danger">{t("loadFailed")}</p>
          <Button variant="secondary" onClick={model.retry}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
      <div
        aria-live="polite"
        className="flex max-h-96 flex-col gap-3 overflow-y-auto"
        data-testid="chat-list"
      >
        {model.loading ? <Spinner label={t("loading")} /> : null}
        {!model.loading && model.items.length === 0 && model.sending === null ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : null}
        {model.items.map((item) => (
          <Item key={item.id} item={item} model={model} designId={designId} />
        ))}
        {model.sending === null ? null : (
          <>
            <MessageBubble role="user" text={model.sending} />
            <p className="self-end text-sm text-muted" data-testid="chat-preparing">
              {t("preparing")}
            </p>
          </>
        )}
      </div>
      <ChatComposer
        text={model.text}
        onText={model.setText}
        state={model.compose}
        onSubmit={model.submit}
        quota={model.quota}
      />
    </div>
  );
}

/**
 * The tab content; before the first saved version it only says to save one (the API ties a proposal to a version).
 *
 * @param props - Design, current version and the applied callback.
 * @returns The panel.
 */
export function ChatPanel(props: Readonly<ChatPanelProps>): ReactElement {
  const t = useTranslations("chatEdit");
  if (props.versionId === null) {
    return (
      <div className="flex flex-col gap-1" data-testid="chat-no-version">
        <p className="font-semibold">{t("noVersion.title")}</p>
        <p className="text-sm text-muted">{t("noVersion.text")}</p>
      </div>
    );
  }
  return <Conversation {...props} />;
}
