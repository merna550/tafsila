import { describe, expect, it } from "vitest";
import type { CutPlanStep } from "@/shared/pattern-preview";
import { currentStepId } from "./current-step";

const step = (id: string): CutPlanStep => ({
  id,
  no: 1,
  text: { ar: "", en: "" },
  pointIds: [],
  guides: [],
  group: "marks",
});
const steps = [step("a"), step("b"), step("c")];

describe("currentStepId", () => {
  it("is the first unticked step when nothing was tapped", () => {
    expect(currentStepId(steps, new Set(["a"]), null)).toBe("b");
  });
  it("is the tapped step when it exists, even if ticked", () => {
    expect(currentStepId(steps, new Set(["a"]), "c")).toBe("c");
    expect(currentStepId(steps, new Set(["a"]), "a")).toBe("a");
  });
  it("ignores a tapped id that is not in the list", () => {
    expect(currentStepId(steps, new Set(), "gone")).toBe("a");
  });
  it("is null when every step is ticked", () => {
    expect(currentStepId(steps, new Set(["a", "b", "c"]), null)).toBeNull();
  });
  it("moves on once the tap is cleared after ticking", () => {
    expect(currentStepId(steps, new Set(["a", "b"]), null)).toBe("c");
  });
});
