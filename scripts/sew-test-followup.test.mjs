// Tests for the sew-test follow-up warning (issue #184), using fixture PR bodies.
import { describe, expect, it } from "vitest";
import { checkSewTestFollowUp, warningFor } from "./sew-test-followup.mjs";

const labels = ["area:engine", "needs:sew-test", "type:feature"];

describe("checkSewTestFollowUp", () => {
  it("flags an engine PR with needs:sew-test and no follow-up line", () => {
    expect(checkSewTestFollowUp("Closes #1\n\nNothing else", labels)).toEqual({
      required: true,
      missing: true,
    });
  });

  it("accepts a body that names the follow-up issue", () => {
    expect(checkSewTestFollowUp("Closes #1\nSew-test follow-up: #200", labels).missing).toBe(false);
  });

  it("ignores PRs without the label or outside the engine", () => {
    expect(checkSewTestFollowUp("x", ["area:engine"]).required).toBe(false);
    expect(checkSewTestFollowUp("x", ["needs:sew-test", "area:web"]).required).toBe(false);
  });

  it("tolerates an empty body", () => {
    expect(checkSewTestFollowUp(undefined, labels).missing).toBe(true);
  });
});

describe("warningFor", () => {
  it("prints a workflow warning only when the follow-up is missing", () => {
    expect(warningFor("no link", JSON.stringify(labels))).toMatch(/^::warning /);
    expect(warningFor("Sew-test follow-up: #5", JSON.stringify(labels))).toBe("");
  });
});
