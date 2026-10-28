import { describe, expect, it } from "vitest";
import { fabricErrorToApiError } from "./fabric-error";

describe("fabricErrorToApiError", () => {
  it("gives the nesting codes a short text in both languages", () => {
    const invalid = fabricErrorToApiError({ code: "PATTERN_INVALID", message: "x" });
    expect(invalid.kind).toBe("validation");
    expect(invalid.messageEn).toContain("validation");
    expect(invalid.messageAr).not.toBe("");
    const failed = fabricErrorToApiError({ code: "WORKER_FAILED", message: "x" });
    expect(failed.kind).toBe("unknown");
  });

  it("hands anything else to the preview mapping", () => {
    const other = fabricErrorToApiError({ code: "ENGINE_CRASH", message: "boom" });
    expect(other.code).not.toBe("PATTERN_INVALID");
  });
});
