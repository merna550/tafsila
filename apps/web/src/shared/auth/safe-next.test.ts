import { describe, expect, it } from "vitest";
import { sanitizeNext } from "./safe-next";

describe("sanitizeNext", () => {
  it("accepts same-site paths", () => {
    expect(sanitizeNext("/dashboard")).toBe("/dashboard");
    expect(sanitizeNext("/en/dashboard?tab=1")).toBe("/en/dashboard?tab=1");
  });

  it.each([
    "//evil.com",
    "https://evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    "/a\\b",
    "/a\nb",
  ])("rejects %j", (value) => {
    expect(sanitizeNext(value)).toBeNull();
  });

  it("rejects missing values", () => {
    expect(sanitizeNext(null)).toBeNull();
    expect(sanitizeNext(undefined)).toBeNull();
  });
});
