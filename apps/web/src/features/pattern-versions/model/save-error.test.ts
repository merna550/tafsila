import { describe, expect, it } from "vitest";
import { ApiError, clientApiError } from "@/shared/api";
import { patternInvalidReport } from "./save-error";

const report = { status: "fail", checks: [] } as never;

/**
 * Builds an API error.
 *
 * @param code - Error code.
 * @param withReport - Whether the server attached a report.
 * @returns The error.
 */
function apiError(code: string, withReport: boolean): ApiError {
  return new ApiError({
    code,
    kind: "validation",
    status: 422,
    messageAr: "x",
    messageEn: "x",
    ...(withReport ? { report } : {}),
  });
}

describe("patternInvalidReport", () => {
  it("returns the report of a PATTERN_INVALID answer", () => {
    expect(patternInvalidReport(apiError("PATTERN_INVALID", true))).toBe(report);
  });
  it("returns null without a report, for other codes and for other errors", () => {
    expect(patternInvalidReport(apiError("PATTERN_INVALID", false))).toBeNull();
    expect(patternInvalidReport(apiError("VALIDATION_FAILED", true))).toBeNull();
    expect(patternInvalidReport(clientApiError("network"))).toBeNull();
    expect(patternInvalidReport(new Error("x"))).toBeNull();
  });
});
