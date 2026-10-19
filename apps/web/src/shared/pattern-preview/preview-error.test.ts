import { describe, expect, it } from "vitest";
import { routeError } from "../error-display";
import { previewErrorToApiError } from "./preview-error";

describe("previewErrorToApiError", () => {
  it("keeps the Arabic text of a known input error and shows it in place", () => {
    const error = previewErrorToApiError({
      code: "BODICE_SHOULDER_INVALID",
      message: "x",
      messageAr: "نص عربي",
      messageEn: "english",
    });
    const route = routeError(error, "action", "ar");
    expect(route.message).toBe("نص عربي");
    expect(route.unexpected).toBe(false);
  });

  it("marks an engine crash as unexpected with the generic message", () => {
    const route = routeError(
      previewErrorToApiError({ code: "ENGINE_CRASH", message: "boom" }),
      "action",
      "ar",
    );
    expect(route.unexpected).toBe(true);
    expect(route.message).not.toContain("boom");
  });
});
