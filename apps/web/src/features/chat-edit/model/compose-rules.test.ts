import { MAX_CHAT_MESSAGE_LENGTH } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { composeState, type ComposeInput } from "./compose-rules";

const ok: ComposeInput = {
  text: "make it longer",
  used: 2,
  limit: 10,
  hasVersion: true,
  dailyLimited: false,
  busy: false,
};

describe("composeState", () => {
  it("allows a normal message and counts what is left", () => {
    expect(composeState(ok)).toMatchObject({ canSend: true, block: null, remaining: 8, length: 14 });
  });

  it("blocks empty and whitespace-only text", () => {
    expect(composeState({ ...ok, text: "" }).canSend).toBe(false);
    expect(composeState({ ...ok, text: "   \n " }).canSend).toBe(false);
  });

  it("accepts exactly the limit and blocks one more", () => {
    expect(composeState({ ...ok, text: "a".repeat(MAX_CHAT_MESSAGE_LENGTH) }).canSend).toBe(true);
    const long = composeState({ ...ok, text: "a".repeat(MAX_CHAT_MESSAGE_LENGTH + 1) });
    expect(long).toMatchObject({ canSend: false, tooLong: true });
  });

  it("blocks when the quota is used up", () => {
    expect(composeState({ ...ok, used: 10 })).toMatchObject({ canSend: false, block: "quota", remaining: 0 });
  });

  it("blocks without a saved version, first of all reasons", () => {
    expect(composeState({ ...ok, hasVersion: false, used: 10 }).block).toBe("no-version");
  });

  it("blocks after the daily limit and while busy", () => {
    expect(composeState({ ...ok, dailyLimited: true }).block).toBe("daily");
    expect(composeState({ ...ok, busy: true }).block).toBe("busy");
  });
});
