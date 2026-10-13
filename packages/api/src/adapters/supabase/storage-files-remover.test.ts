import { describe, expect, it } from "vitest";
import { createStorageFilesRemover } from "./storage-files-remover";

const USER = "aaaaaaaa-0000-4000-8000-00000000000a";
const base = { supabaseUrl: "http://127.0.0.1:54321/", serviceRoleKey: "service" };

/** A request the fake recorded. */
interface Call {
  readonly url: string;
  readonly method: string;
  readonly body: Record<string, unknown>;
}

/**
 * Builds a fake Storage: listings come from `listings` by prefix (and offset), deletes are recorded.
 *
 * @param listings - Entries per `prefix@offset`; a missing key lists nothing.
 * @param deleteStatus - Status answered to deletes.
 * @returns The fake and the recorded calls.
 */
function fakeStorage(listings: Record<string, unknown[]>, deleteStatus = 200) {
  const calls: Call[] = [];
  const fetchImpl = ((url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    calls.push({ url, method: String(init.method), body });
    if (init.method === "DELETE") return Promise.resolve(new Response("[]", { status: deleteStatus }));
    const key = `${String(body.prefix)}@${String(body.offset)}`;
    return Promise.resolve(new Response(JSON.stringify(listings[key] ?? []), { status: 200 }));
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe("storage files remover", () => {
  it("lists the user's folder and removes every file, folders included", async () => {
    const { calls, fetchImpl } = fakeStorage({
      [`${USER}@0`]: [
        { name: "a.png", id: "1" },
        { name: "sub", id: null },
      ],
      [`${USER}/sub@0`]: [{ name: "b.png", id: "2" }],
    });
    await createStorageFilesRemover({ ...base, buckets: ["design-photos"], fetchImpl }).removeAll(USER);
    const del = calls.find((c) => c.method === "DELETE");
    expect(del?.url).toBe("http://127.0.0.1:54321/storage/v1/object/design-photos");
    expect(del?.body).toEqual({ prefixes: [`${USER}/a.png`, `${USER}/sub/b.png`] });
  });

  it("does nothing when the user has no files (repeat is safe)", async () => {
    const { calls, fetchImpl } = fakeStorage({});
    await createStorageFilesRemover({ ...base, buckets: ["design-photos"], fetchImpl }).removeAll(USER);
    expect(calls.filter((c) => c.method === "DELETE")).toEqual([]);
  });

  it("pages through long listings and removes in chunks of 100", async () => {
    const page = (from: number) =>
      Array.from({ length: 100 }, (_, i) => ({ name: `f${from + i}.png`, id: "x" }));
    const { calls, fetchImpl } = fakeStorage({
      [`${USER}@0`]: page(0),
      [`${USER}@100`]: [{ name: "last.png", id: "x" }],
    });
    await createStorageFilesRemover({ ...base, buckets: ["design-photos"], fetchImpl }).removeAll(USER);
    const deletes = calls.filter((c) => c.method === "DELETE");
    expect(deletes.map((d) => (d.body.prefixes as string[]).length)).toEqual([100, 1]);
  });

  it("cleans every bucket of the registry by default", async () => {
    const { calls, fetchImpl } = fakeStorage({});
    await createStorageFilesRemover({ ...base, fetchImpl }).removeAll(USER);
    expect(calls[0]?.url).toBe("http://127.0.0.1:54321/storage/v1/object/list/design-photos");
  });

  it("refuses an id that is not a UUID before any request", async () => {
    const { calls, fetchImpl } = fakeStorage({});
    await expect(createStorageFilesRemover({ ...base, fetchImpl }).removeAll("")).rejects.toThrow(/user id/);
    expect(calls).toEqual([]);
  });

  it("fails with the status when Storage fails", async () => {
    const { fetchImpl } = fakeStorage({ [`${USER}@0`]: [{ name: "a.png", id: "1" }] }, 500);
    await expect(
      createStorageFilesRemover({ ...base, buckets: ["design-photos"], fetchImpl }).removeAll(USER),
    ).rejects.toThrow("Storage request failed with 500");
  });
});
