import { describe, expect, it } from "vitest";
import { createMemoryAiUsageRepository } from "../adapters/memory/ai-usage-repository";
import { createMemoryDesignRepository } from "../adapters/memory/design-repository";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { createMemoryPhotoStorage } from "../adapters/memory/photo-storage";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { createDesign } from "./create-design";
import { createPhotoUploads } from "./create-photo-uploads";
import { deleteDesign } from "./delete-design";
import { deletePhoto } from "./delete-photo";
import { listPhotos } from "./list-photos";

const a = authFor(USER_A);
const b = authFor(USER_B);
const photo = (slot: "front" | "back" | "side", contentType = "image/jpeg", sizeBytes = 1000) => ({
  slot,
  contentType,
  sizeBytes,
});

/**
 * Fresh memory dependencies and one design of user A.
 *
 * @returns The dependencies and the design id.
 */
async function setup() {
  const store = createMemoryStore();
  const deps = {
    designs: createMemoryDesignRepository(store),
    photoStorage: createMemoryPhotoStorage(),
    profiles: { get: () => Promise.resolve(undefined), update: () => Promise.resolve(undefined) },
    clock: { now: () => new Date() },
  };
  const design = await createDesign(deps, a, { category: "dress" });
  return { deps, id: design.id };
}

describe("design photo use cases", () => {
  it("signs 1 to 3 uploads and records the paths", async () => {
    const { deps, id } = await setup();
    const { uploads } = await createPhotoUploads(deps, a, id, {
      photos: [photo("front"), photo("back", "image/png"), photo("side", "image/webp")],
    });
    expect(uploads.map((u) => u.path)).toEqual([
      `${USER_A}/${id}/front.jpg`,
      `${USER_A}/${id}/back.png`,
      `${USER_A}/${id}/side.webp`,
    ]);
    expect(uploads[0]?.signedUrl).toContain("token=");
    expect(await deps.designs.getPhotoPaths(a, id)).toHaveLength(3);
  });

  it("refuses a missing front, HEIC, a large file and a fourth photo", async () => {
    const { deps, id } = await setup();
    await expect(createPhotoUploads(deps, a, id, { photos: [photo("back")] })).rejects.toMatchObject({
      code: "PHOTO_FRONT_REQUIRED",
    });
    await expect(
      createPhotoUploads(deps, a, id, { photos: [photo("front", "image/heic")] }),
    ).rejects.toMatchObject({ code: "PHOTO_TYPE_NOT_ALLOWED" });
    await expect(
      createPhotoUploads(deps, a, id, { photos: [photo("front", "image/jpeg", 11 * 1024 * 1024)] }),
    ).rejects.toMatchObject({ code: "PHOTO_TOO_LARGE" });
    await expect(
      createPhotoUploads(deps, a, id, {
        photos: [photo("front"), photo("back"), photo("side"), photo("front")],
      }),
    ).rejects.toMatchObject({ code: "PHOTO_LIMIT_REACHED" });
    expect(await deps.designs.getPhotoPaths(a, id)).toEqual([]);
  });

  it("allows adding a back photo later and replaces the front, removing the old object when its type changed", async () => {
    const { deps, id } = await setup();
    await createPhotoUploads(deps, a, id, { photos: [photo("front")] });
    deps.photoStorage.put(`${USER_A}/${id}/front.jpg`);
    await createPhotoUploads(deps, a, id, { photos: [photo("back")] });
    await createPhotoUploads(deps, a, id, { photos: [photo("front", "image/png")] });
    expect(await deps.designs.getPhotoPaths(a, id)).toEqual([
      `${USER_A}/${id}/back.jpg`,
      `${USER_A}/${id}/front.png`,
    ]);
    expect(deps.photoStorage.objects.has(`${USER_A}/${id}/front.jpg`)).toBe(false);
  });

  it("lists only photos that were uploaded, front first, with 5 minute URLs", async () => {
    const { deps, id } = await setup();
    await createPhotoUploads(deps, a, id, { photos: [photo("front"), photo("side")] });
    deps.photoStorage.put(`${USER_A}/${id}/side.jpg`);
    deps.photoStorage.put(`${USER_A}/${id}/front.jpg`);
    const { photos } = await listPhotos(deps, a, id);
    expect(photos.map((p) => p.slot)).toEqual(["front", "side"]);
    expect(photos[0]?.url).toContain("expires=300");
  });

  it("deletes one slot; the front goes last; a missing slot is PHOTO_NOT_FOUND", async () => {
    const { deps, id } = await setup();
    await createPhotoUploads(deps, a, id, { photos: [photo("front"), photo("back")] });
    deps.photoStorage.put(`${USER_A}/${id}/back.jpg`);
    await expect(deletePhoto(deps, a, id, "side")).rejects.toMatchObject({ code: "PHOTO_NOT_FOUND" });
    await expect(deletePhoto(deps, a, id, "front")).rejects.toMatchObject({ code: "PHOTO_FRONT_REQUIRED" });
    await deletePhoto(deps, a, id, "back");
    expect(deps.photoStorage.objects.size).toBe(0);
    await deletePhoto(deps, a, id, "front");
    expect(await deps.designs.getPhotoPaths(a, id)).toEqual([]);
  });

  it("behaves as if another user's design did not exist", async () => {
    const { deps, id } = await setup();
    await expect(createPhotoUploads(deps, b, id, { photos: [photo("front")] })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(listPhotos(deps, b, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deletePhoto(deps, b, id, "front")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("removes the design's photos when the design is deleted, and keeps them when it is not the caller's", async () => {
    const { deps, id } = await setup();
    await createPhotoUploads(deps, a, id, { photos: [photo("front")] });
    deps.photoStorage.put(`${USER_A}/${id}/front.jpg`);
    await expect(deleteDesign(deps, b, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(deps.photoStorage.objects.size).toBe(1);
    await deleteDesign(deps, a, id);
    expect(deps.photoStorage.objects.size).toBe(0);
  });
});

describe("memory ai usage", () => {
  it("counts only the user's calls of that kind on the same UTC day", async () => {
    let at = new Date("2026-11-01T01:00:00Z");
    const usage = createMemoryAiUsageRepository(() => at);
    const base = { provider: "fake", model: "m", inputTokens: 1, outputTokens: 1, costUsd: 0, latencyMs: 1 };
    await usage.record({ ...base, userId: USER_A, kind: "analyze" });
    await usage.record({ ...base, userId: USER_A, kind: "chat" });
    await usage.record({ ...base, userId: USER_B, kind: "analyze" });
    at = new Date("2026-11-02T00:30:00Z");
    await usage.record({ ...base, userId: USER_A, kind: "analyze" });
    // "now" is 00:30 UTC on the 2nd: yesterday's analysis, the chat and the other user's row do not count.
    expect(await usage.countToday(USER_A, "analyze", at)).toBe(1);
    expect(await usage.countToday(USER_A, "chat", at)).toBe(0);
    expect(await usage.countToday(USER_B, "analyze", at)).toBe(0);
  });
});
