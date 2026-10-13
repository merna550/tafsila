import { describe, expect, it } from "vitest";
import { matchesDeleteWord } from "./delete-word";

describe("matchesDeleteWord", () => {
  it("accepts the Arabic word, also with surrounding spaces", () => {
    expect(matchesDeleteWord("حذف", "ar")).toBe(true);
    expect(matchesDeleteWord("  حذف ", "ar")).toBe(true);
  });

  it("accepts the English word only in capitals", () => {
    expect(matchesDeleteWord("DELETE", "en")).toBe(true);
    expect(matchesDeleteWord("delete", "en")).toBe(false);
  });

  it("rejects the other language's word, partial words and empty text", () => {
    expect(matchesDeleteWord("DELETE", "ar")).toBe(false);
    expect(matchesDeleteWord("حذف", "en")).toBe(false);
    expect(matchesDeleteWord("حذ", "ar")).toBe(false);
    expect(matchesDeleteWord("", "ar")).toBe(false);
  });
});
