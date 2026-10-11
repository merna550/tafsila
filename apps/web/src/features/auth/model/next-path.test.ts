import { describe, expect, it } from "vitest";
import { resolveNextPath } from "./next-path";

describe("resolveNextPath", () => {
  it("keeps a same-site path and drops the English prefix", () => {
    expect(resolveNextPath("/dashboard")).toBe("/dashboard");
    expect(resolveNextPath("/en/dashboard")).toBe("/dashboard");
    expect(resolveNextPath("/en")).toBe("/dashboard");
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "", null, undefined])(
    "falls back to the dashboard for %s",
    (value) => {
      expect(resolveNextPath(value)).toBe("/dashboard");
    },
  );
});
