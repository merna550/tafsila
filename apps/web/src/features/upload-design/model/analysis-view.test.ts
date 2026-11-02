import { describe, expect, it } from "vitest";
import { phaseOf, shouldKeepPolling, SLOW_AFTER_MS } from "./analysis-view";

describe("shouldKeepPolling", () => {
  it("polls until done or failed", () => {
    expect(shouldKeepPolling(undefined)).toBe(true);
    expect(shouldKeepPolling({ status: "pending" })).toBe(true);
    expect(shouldKeepPolling({ status: "done" })).toBe(false);
    expect(shouldKeepPolling({ status: "failed" })).toBe(false);
  });
});

describe("phaseOf", () => {
  it("says running, then slow after 45 s, and follows the final states", () => {
    expect(phaseOf({ status: "pending" }, 1000)).toBe("running");
    expect(phaseOf({ status: "pending" }, SLOW_AFTER_MS)).toBe("slow");
    expect(phaseOf({ status: "failed" }, 1000)).toBe("failed");
    expect(phaseOf({ status: "done" }, SLOW_AFTER_MS * 2)).toBe("done");
  });
});
