// Tests for scripts/dispatch.mjs: pure selection logic with fake issue lists.
import { describe, expect, it } from "vitest";
import { parseDependencies, buildModel, selectIssue } from "./dispatch.mjs";

/**
 * Builds a fake open issue.
 *
 * @param number Issue number.
 * @param labels Label names.
 * @param body Issue body.
 * @returns Issue in the shape the dispatcher expects.
 */
const issue = (number, labels = [], body = "") => ({ number, labels, body });

const ready = (n, extra = [], body = "") =>
  issue(n, ["status:ready", "priority:P2", "area:ui", ...extra], body);
const base = { issues: [], closed: new Set(), openReviewPrs: 0, maxParallel: 1, enabled: true };

describe("parseDependencies", () => {
  it("reads one or many 'Depends on' references", () => {
    expect(parseDependencies("Depends on #3")).toEqual([3]);
    expect(parseDependencies("depends on #3, #4 and #5")).toEqual([3, 4, 5]);
    expect(parseDependencies("nothing here #9")).toEqual([]);
  });
});

describe("buildModel", () => {
  it("maps build:* labels to model aliases and defaults to sonnet", () => {
    expect(buildModel(["build:opus"])).toBe("opus");
    expect(buildModel(["build:haiku"])).toBe("haiku");
    expect(buildModel(["type:chore"])).toBe("sonnet");
  });
});

describe("selectIssue", () => {
  it("picks the highest priority ready issue, then the lowest number", () => {
    const issues = [ready(5), issue(6, ["status:ready", "priority:P0", "area:api"]), ready(4)];
    expect(selectIssue({ ...base, issues }).pick.number).toBe(6);
    expect(selectIssue({ ...base, issues: [ready(5), ready(4)] }).pick.number).toBe(4);
  });

  it("skips issues with open dependencies or needs:decision", () => {
    const issues = [ready(1, [], "Depends on #9"), ready(2, ["needs:decision"]), ready(3)];
    expect(selectIssue({ ...base, issues }).pick.number).toBe(3);
    expect(selectIssue({ ...base, issues, closed: new Set([9]) }).pick.number).toBe(1);
  });

  it("only considers status:ready issues", () => {
    const issues = [issue(1, ["status:plan-review", "priority:P0"])];
    const result = selectIssue({ ...base, issues });
    expect(result.pick).toBeNull();
    expect(result.reason).toMatch(/no ready issue/i);
  });

  it("starts nothing while another issue is in progress (limit 1)", () => {
    const issues = [issue(1, ["status:in-progress", "area:ui"]), ready(2)];
    const result = selectIssue({ ...base, issues });
    expect(result.pick).toBeNull();
    expect(result.reason).toMatch(/in progress/i);
  });

  it("allows a second issue only in a different area when maxParallel is 2", () => {
    const inProgress = issue(1, ["status:in-progress", "area:ui"]);
    const sameArea = ready(2);
    const otherArea = issue(3, ["status:ready", "priority:P3", "area:api"]);
    const opts = { ...base, maxParallel: 2 };
    expect(selectIssue({ ...opts, issues: [inProgress, sameArea, otherArea] }).pick.number).toBe(3);
    expect(selectIssue({ ...opts, issues: [inProgress, sameArea] }).pick).toBeNull();
  });

  it("does not exceed maxParallel", () => {
    const busy = [issue(1, ["status:in-progress", "area:ui"]), issue(2, ["status:in-progress", "area:api"])];
    const result = selectIssue({
      ...base,
      maxParallel: 2,
      issues: [...busy, issue(3, ["status:ready", "area:db"])],
    });
    expect(result.pick).toBeNull();
  });

  it("stops at 3 open pull requests waiting for review", () => {
    const result = selectIssue({ ...base, issues: [ready(1)], openReviewPrs: 3 });
    expect(result.pick).toBeNull();
    expect(result.reason).toMatch(/3 pull requests/i);
    expect(selectIssue({ ...base, issues: [ready(1)], openReviewPrs: 2 }).pick.number).toBe(1);
  });

  it("is paused by enabled=false", () => {
    const result = selectIssue({ ...base, issues: [ready(1)], enabled: false });
    expect(result.pick).toBeNull();
    expect(result.reason).toMatch(/paused/i);
  });

  it("explains the pick and returns the build model", () => {
    const result = selectIssue({ ...base, issues: [ready(7, ["build:haiku"])] });
    expect(result.model).toBe("haiku");
    expect(result.reason).toMatch(/#7/);
  });
});
