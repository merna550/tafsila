import { describe, expect, it } from "vitest";
import { messagesByField, toIssueView } from "./issues";

const ISSUE = { code: "X", fields: ["waist", "hip"], message_ar: "عربي", message_en: "english" };

describe("messagesByField", () => {
  it("puts an issue naming two fields under both", () => {
    const result = messagesByField([ISSUE], "en");
    expect(result.waist).toEqual([{ code: "X", text: "english" }]);
    expect(result.hip).toEqual([{ code: "X", text: "english" }]);
  });

  it("picks the Arabic text for ar", () => {
    expect(messagesByField([ISSUE], "ar").waist?.[0]?.text).toBe("عربي");
  });
});

describe("toIssueView", () => {
  it("separates errors from warnings and counts errors", () => {
    const view = toIssueView({ errors: [ISSUE, ISSUE], warnings: [ISSUE] }, "en");
    expect(view.errorCount).toBe(2);
    expect(view.warnings.waist).toHaveLength(1);
  });
});
