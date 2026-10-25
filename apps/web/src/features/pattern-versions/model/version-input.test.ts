import { describe, expect, it } from "vitest";
import type { PatternVersionDetail } from "@tafsila/schemas";
import { versionPreviewInput } from "./version-input";

describe("versionPreviewInput", () => {
  it("keeps only the spec, measurements and options of the version", () => {
    const version = {
      spec: { a: 1 },
      measurements: { b: 2 },
      options: { c: 3 },
      versionNo: 4,
    } as unknown as PatternVersionDetail["version"];
    expect(versionPreviewInput(version)).toEqual({
      spec: { a: 1 },
      measurements: { b: 2 },
      options: { c: 3 },
    });
  });
});
