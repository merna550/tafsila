import { describe, expect, it } from "vitest";
import type { PatternVersionDetail } from "@tafsila/schemas";
import { versionPreviewInput } from "./version-input";

describe("versionPreviewInput", () => {
  it("adds the ease profile and size label to the stored options, as the server does", () => {
    const version = {
      spec: { a: 1 },
      measurements: { b: 2 },
      options: { c: 3 },
      versionNo: 4,
      easeProfile: "regular",
      sizeLabel: null,
    } as unknown as PatternVersionDetail["version"];
    expect(versionPreviewInput(version)).toEqual({
      spec: { a: 1 },
      measurements: { b: 2 },
      options: { c: 3, easeProfile: "regular", sizeLabel: "unknown" },
    });
  });
});
