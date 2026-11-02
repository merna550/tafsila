/** Tests for the run-time message lookup (issue #345). */
import { describe, expect, it } from "vitest";
import { lookupMessage } from "./message-lookup";

const MESSAGES = { a: { b: { c: "text" }, d: 3 } };

describe("lookupMessage", () => {
  it("finds a nested text", () => {
    expect(lookupMessage(MESSAGES, ["a", "b", "c"])).toBe("text");
  });

  it("returns undefined for a missing step or a non-text end", () => {
    expect(lookupMessage(MESSAGES, ["a", "x", "c"])).toBeUndefined();
    expect(lookupMessage(MESSAGES, ["a", "d"])).toBeUndefined();
    expect(lookupMessage(MESSAGES, ["a", "b"])).toBeUndefined();
  });
});
