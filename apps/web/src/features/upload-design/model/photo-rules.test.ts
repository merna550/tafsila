import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES } from "@tafsila/schemas";
import { canStartAnalysis, freePlaces, rejectFile, slotAt, type PhotoItem } from "./photo-rules";

const item = (status: PhotoItem["status"]): PhotoItem => ({ id: status, status, progress: 0 });

describe("rejectFile", () => {
  it("accepts JPG, PNG, WebP and HEIC", () => {
    for (const [name, type] of [
      ["a.jpg", "image/jpeg"],
      ["a.png", "image/png"],
      ["a.webp", "image/webp"],
      ["a.heic", ""],
    ] as const) {
      expect(rejectFile({ name, type, size: 100 })).toBeNull();
    }
  });
  it("refuses other types and files over 10 MB", () => {
    expect(rejectFile({ name: "a.gif", type: "image/gif", size: 100 })).toBe("type");
    expect(rejectFile({ name: "a.jpg", type: "image/jpeg", size: MAX_PHOTO_BYTES + 1 })).toBe("size");
    expect(rejectFile({ name: "a.jpg", type: "image/jpeg", size: MAX_PHOTO_BYTES })).toBeNull();
  });
});

describe("slots", () => {
  it("fills front, back, side and allows at most 3", () => {
    expect([0, 1, 2].map(slotAt)).toEqual(["front", "back", "side"]);
    expect([0, 1, 3, 5].map(freePlaces)).toEqual([3, 2, 0, 0]);
  });
});

describe("canStartAnalysis", () => {
  it("needs a front photo and nothing preparing or failed", () => {
    expect(canStartAnalysis([])).toBe(false);
    expect(canStartAnalysis([item("ready")])).toBe(true);
    expect(canStartAnalysis([item("ready"), item("preparing")])).toBe(false);
    expect(canStartAnalysis([item("ready"), item("failed")])).toBe(false);
  });
});
