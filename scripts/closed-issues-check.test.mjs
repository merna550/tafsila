import { describe, expect, it } from "vitest";
import { issuesWithoutMergedPr } from "./closed-issues-check.mjs";

describe("issuesWithoutMergedPr", () => {
  it("keeps issues that no merged PR closes or names by branch", () => {
    const issues = [
      { number: 1, title: "closed by keyword" },
      { number: 2, title: "closed by branch" },
      { number: 3, title: "only mentioned" },
    ];
    const prs = [
      { body: "Closes #1", head: { ref: "x" } },
      { body: "", head: { ref: "feat/2-thing" } },
      { body: "see #3 and Part of #3", head: { ref: "docs/other" } },
    ];
    expect(issuesWithoutMergedPr(issues, prs)).toEqual([{ number: 3, title: "only mentioned" }]);
  });
});
