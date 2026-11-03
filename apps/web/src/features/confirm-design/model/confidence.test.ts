import { defaultSpec } from "@tafsila/engine/spec-rules";
import type { DesignAnalysisResult } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { isWeakOverall, levelOf, lowConfidencePaths, percentOf } from "./confidence";

const base: DesignAnalysisResult = {
  spec: defaultSpec("dress"),
  category: { value: "dress", confidence: 0.9 },
  confidence: {},
  notes: [],
  unsupported: [],
};

describe("confidence", () => {
  it("groups numbers at the 0.6 and 0.85 edges", () => {
    expect(levelOf(0.59)).toBe("low");
    expect(levelOf(0.6)).toBe("medium");
    expect(levelOf(0.85)).toBe("high");
    expect(percentOf(0.964)).toBe(96);
  });

  it("is weak only when more than half of the scored features are low", () => {
    expect(isWeakOverall(base)).toBe(false);
    expect(isWeakOverall({ ...base, confidence: { belt: 0.1, lining: 0.2, waistband: 0.9 } })).toBe(true);
    expect(isWeakOverall({ ...base, confidence: { belt: 0.1, lining: 0.9 } })).toBe(false);
    expect(lowConfidencePaths({ ...base, confidence: { belt: 0.1, lining: 0.9 } })).toEqual(["belt"]);
  });
});
