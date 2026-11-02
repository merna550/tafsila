import { describe, expect, it } from "vitest";
import { analyzeDesignInputSchema, designAnalysisStateSchema } from "./design-analysis-api";

describe("design analysis API schemas", () => {
  it("accepts an empty body and a hint, trimming spaces", () => {
    expect(analyzeDesignInputSchema.parse({})).toEqual({});
    expect(analyzeDesignInputSchema.parse({ categoryHint: " dress " })).toEqual({ categoryHint: "dress" });
  });

  it("rejects an empty or very long hint", () => {
    expect(analyzeDesignInputSchema.safeParse({ categoryHint: "  " }).success).toBe(false);
    expect(analyzeDesignInputSchema.safeParse({ categoryHint: "x".repeat(41) }).success).toBe(false);
  });

  it("knows the four states and rejects an unknown one", () => {
    for (const status of ["none", "pending", "done", "failed"]) {
      expect(designAnalysisStateSchema.safeParse({ status }).success).toBe(true);
    }
    expect(designAnalysisStateSchema.safeParse({ status: "running" }).success).toBe(false);
  });

  it("rejects a failure code the API does not define", () => {
    expect(designAnalysisStateSchema.safeParse({ status: "failed", errorCode: "BOOM" }).success).toBe(false);
  });
});
