import { describe, expect, it } from "vitest";
import { MESSAGES, renderWithIntl } from "@/shared/i18n/testing";
import { ChatPanel } from "../ChatPanel";
import { composeState } from "../model/compose-rules";
import { ChatComposer } from "./ChatComposer";
import { MessageBubble } from "./MessageBubble";
import { ProposalCard } from "./ProposalCard";
import { UnsupportedCard } from "./UnsupportedCard";

const noop = (): void => undefined;
const proposal = {
  kind: "proposal" as const,
  id: "m1",
  lines: ["Sleeve length: short → long"],
  baseVersionId: "v1",
  appliedVersionId: null,
  request: "longer sleeves",
};
const card = {
  item: proposal,
  dismissed: false,
  designId: "d1",
  onApply: noop,
  onCancel: noop,
  onAskAgain: noop,
  busy: false,
};
const open = { text: "", used: 3, limit: 10, hasVersion: true, dailyLimited: false, busy: false };

describe("MessageBubble", () => {
  it("shows the user's and the assistant's text in different bubbles", () => {
    expect(renderWithIntl(<MessageBubble role="user" text="hi" />, "en")).toContain(
      'data-testid="chat-user"',
    );
    expect(renderWithIntl(<MessageBubble role="assistant" text="hi" />, "en")).toContain(
      'data-testid="chat-assistant"',
    );
  });
});

describe("ProposalCard", () => {
  it("lists the change lines with Apply and Dismiss", () => {
    const html = renderWithIntl(<ProposalCard {...card} state={{ kind: "idle" }} />, "en");
    expect(html).toContain("Sleeve length: short → long");
    expect(html).toContain(MESSAGES.en.chatEdit.proposal.apply);
    expect(html).toContain(MESSAGES.en.chatEdit.proposal.cancel);
  });

  it("shows the applied version with a link to the history", () => {
    const html = renderWithIntl(<ProposalCard {...card} state={{ kind: "applied", versionNo: 2 }} />, "en");
    expect(html).toContain("Saved as version 2");
    expect(html).toContain("/designs/d1/versions");
    expect(html).not.toContain('data-testid="chat-apply"');
  });

  it("asks to ask again when the proposal is stale", () => {
    const html = renderWithIntl(<ProposalCard {...card} state={{ kind: "stale" }} />, "ar");
    expect(html).toContain(MESSAGES.ar.chatEdit.proposal.askAgain);
    expect(html).not.toContain('data-testid="chat-apply"');
  });
});

describe("UnsupportedCard", () => {
  it("shows the polite text and one button per suggestion", () => {
    const item = { kind: "unsupported" as const, id: "u", text: "Not yet", closest: ["Skirt: A-line"] };
    const html = renderWithIntl(<UnsupportedCard item={item} onTry={noop} disabled={false} />, "en");
    expect(html).toContain("Not yet");
    expect(html).toContain("Skirt: A-line");
  });
});

describe("ChatComposer", () => {
  it("has a labelled box, a counter and an enabled box while messages are left", () => {
    const html = renderWithIntl(
      <ChatComposer text="" onText={noop} onSubmit={noop} quota={open} state={composeState(open)} />,
      "en",
    );
    expect(html).toContain(`aria-label="${MESSAGES.en.chatEdit.composer.label}"`);
    expect(html).toContain("0 / 500");
    expect(html).not.toContain('data-testid="chat-blocked"');
  });

  it("is off with the used and limit text when the quota is used up", () => {
    const used = { ...open, used: 10 };
    const html = renderWithIntl(
      <ChatComposer text="" onText={noop} onSubmit={noop} quota={used} state={composeState(used)} />,
      "en",
    );
    expect(html).toContain('data-testid="chat-blocked"');
    expect(html).toContain("all 10 messages");
    expect(html).toMatch(/<textarea[^>]* disabled=""/);
  });
});

describe("ChatPanel", () => {
  it("asks to save a version first when there is none", () => {
    const html = renderWithIntl(<ChatPanel designId="d1" versionId={null} onApplied={noop} />, "ar");
    expect(html).toContain(MESSAGES.ar.chatEdit.noVersion.title);
  });
});
