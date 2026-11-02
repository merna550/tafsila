import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

let api: MemoryApp;
beforeAll(async () => {
  api = await createMemoryApp();
});

/**
 * Creates a design as user A.
 *
 * @returns The design id.
 */
async function createAsA(): Promise<string> {
  const res = await api.call(USER_A, "POST", "/designs", { category: "dress" });
  return ((await res.json()) as { id: string }).id;
}

const FRONT = { slot: "front", contentType: "image/jpeg", sizeBytes: 2000 };

describe("design photos API", () => {
  it("answers 401 without a token", async () => {
    const id = await createAsA();
    for (const [method, path] of [
      ["POST", `/designs/${id}/photos`],
      ["GET", `/designs/${id}/photos`],
      ["DELETE", `/designs/${id}/photos/front`],
    ] as const) {
      expect(
        (await api.call(undefined, method, path, method === "POST" ? { photos: [FRONT] } : undefined)).status,
      ).toBe(401);
    }
  });

  it("signs an upload (200), lists it after the upload, and deletes it (204)", async () => {
    const id = await createAsA();
    const up = await api.call(USER_A, "POST", `/designs/${id}/photos`, { photos: [FRONT] });
    expect(up.status).toBe(200);
    const { uploads } = (await up.json()) as {
      uploads: { slot: string; path: string; signedUrl: string; token: string }[];
    };
    expect(uploads[0]).toMatchObject({ slot: "front", path: `${USER_A}/${id}/front.jpg` });
    api.photos.put(uploads[0]?.path ?? "");
    const list = await api.call(USER_A, "GET", `/designs/${id}/photos`);
    expect(list.status).toBe(200);
    expect(((await list.json()) as { photos: { slot: string }[] }).photos.map((p) => p.slot)).toEqual([
      "front",
    ]);
    expect((await api.call(USER_A, "DELETE", `/designs/${id}/photos/front`)).status).toBe(204);
    expect(
      ((await (await api.call(USER_A, "GET", `/designs/${id}/photos`)).json()) as { photos: unknown[] })
        .photos,
    ).toEqual([]);
  });

  it.each([
    [{ photos: [{ ...FRONT, slot: "back" }] }, 422, "PHOTO_FRONT_REQUIRED"],
    [{ photos: [{ ...FRONT, sizeBytes: 11 * 1024 * 1024 }] }, 413, "PHOTO_TOO_LARGE"],
    [{ photos: [{ ...FRONT, contentType: "image/heic" }] }, 415, "PHOTO_TYPE_NOT_ALLOWED"],
    [{ photos: [FRONT, FRONT] }, 400, "VALIDATION_FAILED"],
    [{ photos: [] }, 400, "VALIDATION_FAILED"],
  ])("refuses %j with %i %s in the standard error body", async (body, status, code) => {
    const id = await createAsA();
    const res = await api.call(USER_A, "POST", `/designs/${id}/photos`, body);
    expect(res.status).toBe(status);
    const error = (await res.json()) as Record<string, unknown>;
    expect(error.code).toBe(code);
    expect(Object.keys(error)).toEqual(expect.arrayContaining(["message_ar", "message_en", "request_id"]));
  });

  it("answers 404 PHOTO_NOT_FOUND for an empty slot and 404 for another user's design", async () => {
    const id = await createAsA();
    const empty = await api.call(USER_A, "DELETE", `/designs/${id}/photos/back`);
    expect(empty.status).toBe(404);
    expect(((await empty.json()) as { code: string }).code).toBe("PHOTO_NOT_FOUND");
    expect((await api.call(USER_B, "POST", `/designs/${id}/photos`, { photos: [FRONT] })).status).toBe(404);
    expect((await api.call(USER_B, "GET", `/designs/${id}/photos`)).status).toBe(404);
    expect((await api.call(USER_B, "DELETE", `/designs/${id}/photos/front`)).status).toBe(404);
  });

  it("removes the photos with the design and with the account", async () => {
    const id = await createAsA();
    await api.call(USER_A, "POST", `/designs/${id}/photos`, { photos: [FRONT] });
    api.photos.put(`${USER_A}/${id}/front.jpg`);
    expect((await api.call(USER_A, "DELETE", `/designs/${id}`)).status).toBe(204);
    expect(api.photos.objects.size).toBe(0);
    const id2 = await createAsA();
    await api.call(USER_A, "POST", `/designs/${id2}/photos`, { photos: [FRONT] });
    api.photos.put(`${USER_A}/${id2}/front.jpg`);
    api.photos.put(`${USER_B}/other/front.jpg`);
    expect((await api.call(USER_A, "DELETE", "/account", { confirm: "DELETE_MY_ACCOUNT" })).status).toBe(204);
    expect([...api.photos.objects]).toEqual([`${USER_B}/other/front.jpg`]);
  });
});
