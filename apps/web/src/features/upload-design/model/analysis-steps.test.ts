import { describe, expect, it } from "vitest";
import { stepState } from "./analysis-steps";

describe("stepState", () => {
  it("keeps upload done, reads actively and fails on the read step", () => {
    expect(stepState("upload", "running")).toBe("done");
    expect(stepState("read", "running")).toBe("active");
    expect(stepState("read", "slow")).toBe("active");
    expect(stepState("read", "failed")).toBe("failed");
    expect(stepState("prepare", "running")).toBe("waiting");
  });
  it("marks every step done when the analysis is done", () => {
    expect(["upload", "read", "prepare"].map((s) => stepState(s as "upload", "done"))).toEqual([
      "done",
      "done",
      "done",
    ]);
  });
});
