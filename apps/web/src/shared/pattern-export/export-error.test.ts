import { describe, expect, it } from "vitest";
import { exportErrorToApiError } from "./export-error";

describe("exportErrorToApiError", () => {
  it("gives the font failure a connection message that can be retried", () => {
    const error = exportErrorToApiError({ code: "FONT_LOAD_FAILED", message: "404" });
    expect(error.code).toBe("FONT_LOAD_FAILED");
    expect(error.kind).toBe("network");
    expect(error.localizedMessage("en")).toContain("font");
    expect(error.localizedMessage("ar")).not.toBe(error.localizedMessage("en"));
  });

  it("gives build and worker failures the generic message and never the technical text", () => {
    for (const code of ["PDF_BUILD_FAILED", "WORKER_FAILED"]) {
      const error = exportErrorToApiError({ code, message: "TypeError: x is undefined" });
      expect(error.code).toBe(code);
      expect(error.localizedMessage("en")).not.toContain("TypeError");
    }
  });

  it("explains a pattern that did not pass validation", () => {
    const error = exportErrorToApiError({ code: "PATTERN_INVALID", message: "fail" });
    expect(error.kind).toBe("validation");
    expect(error.localizedMessage("en")).toContain("cannot be exported");
  });

  it("keeps the own text of an engine input error", () => {
    const error = exportErrorToApiError({
      code: "SOME_INPUT",
      message: "m",
      messageAr: "عربي",
      messageEn: "english",
    });
    expect(error.code).toBe("SOME_INPUT");
    expect(error.kind).toBe("validation");
    expect(error.localizedMessage("ar")).toBe("عربي");
  });

  it("turns an unknown engine failure into the unknown client error", () => {
    expect(exportErrorToApiError({ code: "ENGINE_CRASH", message: "boom" }).code).toBe("UNKNOWN_ERROR");
  });
});
