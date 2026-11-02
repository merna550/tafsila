import { describe, expect, it } from "vitest";
import { isAnalysisRunning, PENDING_ANALYSIS_TTL_MS, requireSupportedHint } from "./design-analysis";
import { AppError } from "./errors";

const NOW = new Date("2026-11-02T10:00:00.000Z");

describe("requireSupportedHint", () => {
  it("returns no category without a hint and the category for a supported one", () => {
    expect(requireSupportedHint(undefined)).toBeUndefined();
    expect(requireSupportedHint("Dress")).toBe("dress");
    expect(requireSupportedHint("blouse")).toBe("blouse");
  });

  it("refuses anything else as coming soon", () => {
    expect(() => requireSupportedHint("abaya")).toThrow(AppError);
    expect(() => requireSupportedHint("abaya")).toThrow(/coming soon/);
  });
});

describe("isAnalysisRunning", () => {
  const startedAgo = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

  it("is true for a young pending state only", () => {
    expect(isAnalysisRunning({ status: "pending", startedAt: startedAgo(1000) }, NOW)).toBe(true);
    expect(
      isAnalysisRunning({ status: "pending", startedAt: startedAgo(PENDING_ANALYSIS_TTL_MS) }, NOW),
    ).toBe(false);
    expect(isAnalysisRunning({ status: "done", startedAt: startedAgo(1000) }, NOW)).toBe(false);
    expect(isAnalysisRunning(null, NOW)).toBe(false);
    expect(isAnalysisRunning(undefined, NOW)).toBe(false);
  });
});
