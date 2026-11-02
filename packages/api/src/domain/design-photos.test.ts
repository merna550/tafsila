import { describe, expect, it } from "vitest";
import { mergePhotoPaths, planPhotoUploads, slotOfPath } from "./design-photos";

const U = "u";
const D = "d";
const item = (slot: string, contentType = "image/jpeg", sizeBytes = 1000) => ({
  slot,
  contentType,
  sizeBytes,
});
const plan = (photos: ReturnType<typeof item>[], existing: string[] = []) =>
  planPhotoUploads(U, D, existing, { photos } as never);

describe("planPhotoUploads", () => {
  it("builds <user>/<design>/<slot>.<ext> paths", () => {
    expect(
      plan([item("front"), item("back", "image/png"), item("side", "image/webp")]).map((p) => p.path),
    ).toEqual(["u/d/front.jpg", "u/d/back.png", "u/d/side.webp"]);
  });

  it("requires a front photo unless one is stored", () => {
    expect(() => plan([item("back")])).toThrow(expect.objectContaining({ code: "PHOTO_FRONT_REQUIRED" }));
    expect(plan([item("back")], ["u/d/front.jpg"])).toHaveLength(1);
  });

  it("refuses HEIC, too large files and more than three photos", () => {
    expect(() => plan([item("front", "image/heic")])).toThrow(
      expect.objectContaining({ code: "PHOTO_TYPE_NOT_ALLOWED" }),
    );
    expect(() => plan([item("front", "image/jpeg", 10 * 1024 * 1024 + 1)])).toThrow(
      expect.objectContaining({ code: "PHOTO_TOO_LARGE" }),
    );
    expect(plan([item("front", "image/jpeg", 10 * 1024 * 1024)])).toHaveLength(1);
    expect(() => plan([item("front"), item("back"), item("side"), item("front")])).toThrow(
      expect.objectContaining({ code: "PHOTO_LIMIT_REACHED" }),
    );
  });
});

describe("photo paths", () => {
  it("reads the slot from a path", () => {
    expect(slotOfPath("u/d/side.webp")).toBe("side");
    expect(slotOfPath("u/d/other.jpg")).toBeUndefined();
  });

  it("replaces a slot and reports the old object only when its name changed", () => {
    const planned = [{ slot: "front" as const, path: "u/d/front.png" }];
    expect(mergePhotoPaths(["u/d/front.jpg", "u/d/back.jpg"], planned)).toEqual({
      paths: ["u/d/back.jpg", "u/d/front.png"],
      stale: ["u/d/front.jpg"],
    });
    expect(mergePhotoPaths(["u/d/front.jpg"], [{ slot: "front", path: "u/d/front.jpg" }]).stale).toEqual([]);
  });
});
