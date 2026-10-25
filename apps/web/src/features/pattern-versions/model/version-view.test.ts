import type { PatternVersionListItem } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { toVersionRow } from "./version-view";

const NOW = new Date("2026-10-25T12:00:00Z");
const item: PatternVersionListItem = {
  id: "v1",
  versionNo: 3,
  validationStatus: "pass",
  engineVersion: "0.16.0",
  sizeLabel: "M",
  easeProfile: "regular",
  measurementSetId: null,
  createdBy: "user",
  createdAt: "2026-10-24T12:00:00Z",
  isCurrent: true,
};

describe("toVersionRow", () => {
  it("marks the current version and keeps the labels", () => {
    expect(toVersionRow(item, "0.16.0", NOW, "en")).toMatchObject({
      versionNo: 3,
      isCurrent: true,
      status: "pass",
      sizeLabel: "M",
      ease: "regular",
      by: "user",
      saved: "yesterday",
      engineChanged: false,
    });
  });

  it("flags a version made by another engine and keeps the warn state", () => {
    const row = toVersionRow(
      { ...item, engineVersion: "0.0.1", validationStatus: "warn" },
      "0.16.0",
      NOW,
      "en",
    );
    expect(row).toMatchObject({ engineChanged: true, status: "warn" });
  });
});
