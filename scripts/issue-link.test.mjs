import { describe, expect, it } from "vitest";
import { branchMatches, findIssuePr, hasClosingKeyword } from "./issue-link.mjs";

describe("hasClosingKeyword", () => {
  it("matches closing keywords", () => {
    expect(hasClosingKeyword(185, "Closes #185")).toBe(true);
    expect(hasClosingKeyword(185, "closes #185.")).toBe(true);
    expect(hasClosingKeyword(185, "Fixes #185\nmore")).toBe(true);
  });

  it("does not match other numbers or plain mentions", () => {
    expect(hasClosingKeyword(185, "Closes #1850")).toBe(false);
    expect(hasClosingKeyword(185, "Part of #185")).toBe(false);
    expect(hasClosingKeyword(185, "see #185")).toBe(false);
    expect(hasClosingKeyword(185, null)).toBe(false);
  });
});

describe("branchMatches", () => {
  it("matches the issue number branch only", () => {
    expect(branchMatches(185, "chore/185-deliver")).toBe(true);
    expect(branchMatches(185, "chore/1850-x")).toBe(false);
    expect(branchMatches(185, "main")).toBe(false);
  });
});

describe("findIssuePr", () => {
  it("finds by closing keyword or branch, ignoring closed pull requests", () => {
    const prs = [
      { number: 1, state: "closed", body: "Closes #185" },
      { number: 2, body: "Part of #185", headRefName: "feat/9-x" },
      { number: 3, body: "Closes #185", headRefName: "feat/9-x" },
    ];
    expect(findIssuePr(185, prs)?.number).toBe(3);
    expect(findIssuePr(185, [{ number: 4, body: "", head: { ref: "feat/185-a" } }])?.number).toBe(4);
    expect(findIssuePr(134, [{ number: 151, body: "mentions #134" }])).toBeNull();
  });
});
