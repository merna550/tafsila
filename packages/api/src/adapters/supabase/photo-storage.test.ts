import { describe, expect, it } from "vitest";
import { createSupabasePhotoStorage } from "./photo-storage";
import { createStorageRest } from "./storage-rest";

const USER = "aaaaaaaa-0000-4000-8000-00000000000a";
const DESIGN = "00000000-0000-4000-8000-0000000000d1";
const base = { supabaseUrl: "http://127.0.0.1:54321/", serviceRoleKey: "service" };

/** A request the fake recorded. */
interface Call {
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
  readonly headers: Record<string, string>;
}

/**
 * Builds a fake Storage that answers each URL from a table and records the calls.
 *
 * @param answers - JSON answer per `METHOD url`; a missing key answers `[]`.
 * @param status - Status to answer.
 * @returns The storage adapter and the calls.
 */
function setup(answers: Record<string, unknown>, status = 200) {
  const calls: Call[] = [];
  const fetchImpl = ((url: string, init: RequestInit) => {
    calls.push({
      url,
      method: String(init.method),
      body: init.body ? JSON.parse(init.body as string) : undefined,
      headers: init.headers as Record<string, string>,
    });
    return Promise.resolve(new Response(JSON.stringify(answers[`${init.method} ${url}`] ?? []), { status }));
  }) as unknown as typeof fetch;
  return { calls, storage: createSupabasePhotoStorage(createStorageRest({ ...base, fetchImpl })) };
}

const ROOT = "http://127.0.0.1:54321/storage/v1";

describe("supabase photo storage", () => {
  it("signs an upload that may replace the object and reads the token from the URL", async () => {
    const path = `${USER}/${DESIGN}/front.jpg`;
    const { calls, storage } = setup({
      [`POST ${ROOT}/object/upload/sign/design-photos/${USER}/${DESIGN}/front.jpg`]: {
        url: `/object/upload/sign/design-photos/${path}?token=abc`,
      },
    });
    const [upload] = await storage.createUploadUrls([path]);
    expect(upload).toEqual({
      path,
      signedUrl: `${ROOT}/object/upload/sign/design-photos/${path}?token=abc`,
      token: "abc",
    });
    expect(calls[0]?.headers["x-upsert"]).toBe("true");
  });

  it("signs read URLs in one call and skips paths with no object", async () => {
    const { calls, storage } = setup({
      [`POST ${ROOT}/object/sign/design-photos`]: [
        { path: "a/b/front.jpg", signedURL: "/object/sign/design-photos/a/b/front.jpg?token=t" },
        { path: "a/b/back.jpg", signedURL: null },
      ],
    });
    expect(await storage.signedReadUrls(["a/b/front.jpg", "a/b/back.jpg"], 300)).toEqual([
      { path: "a/b/front.jpg", url: `${ROOT}/object/sign/design-photos/a/b/front.jpg?token=t` },
    ]);
    expect(calls[0]?.body).toEqual({ expiresIn: 300, paths: ["a/b/front.jpg", "a/b/back.jpg"] });
    expect(await storage.signedReadUrls([], 300)).toEqual([]);
  });

  it("removes the objects of one design by listing its folder", async () => {
    const { calls, storage } = setup({
      [`POST ${ROOT}/object/list/design-photos`]: [{ name: "front.jpg", id: "1" }],
    });
    await storage.removeDesign(USER, DESIGN);
    const del = calls.find((c) => c.method === "DELETE");
    expect(del?.body).toEqual({ prefixes: [`${USER}/${DESIGN}/front.jpg`] });
    expect(calls[0]?.body).toMatchObject({ prefix: `${USER}/${DESIGN}` });
  });

  it("refuses ids that are not UUIDs and fails with the status only", async () => {
    await expect(setup({}).storage.removeDesign("../x", DESIGN)).rejects.toThrow("UUID");
    await expect(setup({}, 500).storage.remove(["a/b/c.jpg"])).rejects.toThrow(
      "Storage request failed with 500",
    );
  });
});
