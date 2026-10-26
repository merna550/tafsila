import { describe, expect, it } from "vitest";
import { exportFileName } from "./file-name";

describe("exportFileName", () => {
  it("ends an A0 file with -A0.pdf", () => {
    expect(exportFileName({ title: "dress", versionNo: 2, kind: "a0" })).toBe("dress-v2-A0.pdf");
  });

  it("keeps Arabic letters and joins words with dashes", () => {
    expect(exportFileName({ title: "فستان سهرة", versionNo: 3, kind: "a4" })).toBe("فستان-سهرة-v3-A4.pdf");
  });

  it("drops unsafe characters", () => {
    expect(exportFileName({ title: "a/b:c*?", versionNo: 1, kind: "svg" })).toBe("abc-v1.svg");
    expect(exportFileName({ title: 'x\\y|"<>z\u0001', versionNo: 2, kind: "a4" })).toBe("xyz-v2-A4.pdf");
  });

  it("falls back to pattern for an empty title or one of only forbidden characters", () => {
    expect(exportFileName({ title: "", versionNo: 2, kind: "a4" })).toBe("pattern-v2-A4.pdf");
    expect(exportFileName({ title: "///***", versionNo: 5, kind: "svg" })).toBe("pattern-v5.svg");
  });

  it("cuts a long title at 60 characters without splitting a surrogate pair", () => {
    const name = exportFileName({ title: "😀".repeat(100), versionNo: 1, kind: "a4" });
    expect(name).toBe(`${"😀".repeat(60)}-v1-A4.pdf`);
    expect(exportFileName({ title: "a".repeat(100), versionNo: 1, kind: "svg" })).toBe(
      `${"a".repeat(60)}-v1.svg`,
    );
  });

  it("trims dashes left by whitespace", () => {
    expect(exportFileName({ title: "  فستان  ", versionNo: 1, kind: "svg" })).toBe("فستان-v1.svg");
  });
});
