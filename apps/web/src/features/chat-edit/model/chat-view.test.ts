import type { ChatMessage } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { toChatItems } from "./chat-view";

const ID = "00000000-0000-4000-8000-0000000000";
const base = {
  baseVersionId: `${ID}f1`,
  appliedVersionId: null,
  changes: [],
  createdAt: "2026-11-03T10:00:00.000Z",
};
const user: ChatMessage = {
  ...base,
  id: `${ID}a1`,
  role: "user",
  content: "add side pockets",
  outcome: "none",
};
const line = { ar: "جيوب جانبية: لا ← نعم", en: "Side pockets: no → yes" };

describe("toChatItems", () => {
  it("maps a user message to a bubble", () => {
    expect(toChatItems([user], "en")).toEqual([{ kind: "user", id: user.id, text: "add side pockets" }]);
  });

  it("maps a proposal to a card with the lines in the UI language and the request that led to it", () => {
    const proposal: ChatMessage = {
      ...base,
      id: `${ID}a2`,
      role: "assistant",
      content: "",
      outcome: "proposal",
      changes: [line],
    };
    const [, card] = toChatItems([user, proposal], "ar");
    expect(card).toEqual({
      kind: "proposal",
      id: proposal.id,
      lines: [line.ar],
      baseVersionId: `${ID}f1`,
      appliedVersionId: null,
      request: "add side pockets",
    });
  });

  it("keeps the applied version of an applied proposal", () => {
    const applied: ChatMessage = {
      ...base,
      id: `${ID}a3`,
      role: "assistant",
      content: "",
      outcome: "proposal",
      changes: [line],
      appliedVersionId: `${ID}f2`,
    };
    expect(toChatItems([applied], "en")[0]).toMatchObject({ kind: "proposal", appliedVersionId: `${ID}f2` });
  });

  it("maps an unsupported answer with its suggestions in the UI language", () => {
    const unsupported: ChatMessage = {
      ...base,
      id: `${ID}a4`,
      role: "assistant",
      content: "",
      outcome: "unsupported",
      unsupported: { text: { ar: "غير متاح", en: "Not available" }, closest: [line] },
    };
    expect(toChatItems([unsupported], "en")[0]).toEqual({
      kind: "unsupported",
      id: unsupported.id,
      text: "Not available",
      closest: [line.en],
    });
  });

  it("shows any other assistant message as plain text", () => {
    const plain: ChatMessage = {
      ...base,
      id: `${ID}a5`,
      role: "assistant",
      content: "Hello",
      outcome: "none",
    };
    expect(toChatItems([plain], "en")[0]).toEqual({ kind: "assistant", id: plain.id, text: "Hello" });
  });
});
