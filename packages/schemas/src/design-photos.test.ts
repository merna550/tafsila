import { describe, expect, it } from "vitest";
import { createPhotoUploadsInputSchema, photoSlotParamsSchema } from "./design-photos";

describe("design photo schemas", () => {
  const front = { slot: "front", contentType: "image/jpeg", sizeBytes: 1000 };

  it("accepts one or more photos with distinct slots", () => {
    expect(createPhotoUploadsInputSchema.safeParse({ photos: [front] }).success).toBe(true);
    expect(
      createPhotoUploadsInputSchema.safeParse({ photos: [front, { ...front, slot: "back" }] }).success,
    ).toBe(true);
  });

  it("rejects an empty list, a repeated slot, an unknown slot and a non-positive size", () => {
    expect(createPhotoUploadsInputSchema.safeParse({ photos: [] }).success).toBe(false);
    expect(createPhotoUploadsInputSchema.safeParse({ photos: [front, front] }).success).toBe(false);
    expect(createPhotoUploadsInputSchema.safeParse({ photos: [{ ...front, slot: "top" }] }).success).toBe(
      false,
    );
    expect(createPhotoUploadsInputSchema.safeParse({ photos: [{ ...front, sizeBytes: 0 }] }).success).toBe(
      false,
    );
  });

  it("validates the slot path parameter", () => {
    expect(photoSlotParamsSchema.safeParse({ slot: "side" }).success).toBe(true);
    expect(photoSlotParamsSchema.safeParse({ slot: "left" }).success).toBe(false);
  });
});
