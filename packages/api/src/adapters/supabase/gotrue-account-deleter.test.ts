import { describe, expect, it } from "vitest";
import { createGotrueAccountDeleter } from "./gotrue-account-deleter";

/**
 * Builds a fake fetch that answers with a status and records the request.
 *
 * @param status - HTTP status to answer.
 * @returns The fake and the recorded calls.
 */
function fakeFetch(status: number) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response(JSON.stringify({ msg: "user a@b.com" }), { status }));
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const base = { supabaseUrl: "http://127.0.0.1:54321/", serviceRoleKey: "service" };

describe("gotrue account deleter", () => {
  it("calls DELETE on the admin users endpoint with the service role key", async () => {
    const { calls, fetchImpl } = fakeFetch(200);
    await createGotrueAccountDeleter({ ...base, fetchImpl }).deleteUser("u-1");
    expect(calls[0]?.url).toBe("http://127.0.0.1:54321/auth/v1/admin/users/u-1");
    expect(calls[0]?.init.method).toBe("DELETE");
    expect(calls[0]?.init.headers).toMatchObject({ apikey: "service", authorization: "Bearer service" });
  });

  it("treats 404 as success so a repeat after a half-finished run works", async () => {
    const { fetchImpl } = fakeFetch(404);
    await expect(
      createGotrueAccountDeleter({ ...base, fetchImpl }).deleteUser("u-1"),
    ).resolves.toBeUndefined();
  });

  it("fails with the status only, never the provider body", async () => {
    const { fetchImpl } = fakeFetch(500);
    const failure = createGotrueAccountDeleter({ ...base, fetchImpl }).deleteUser("u-1");
    await expect(failure).rejects.toThrow("GoTrue admin delete failed with 500");
    await expect(failure).rejects.not.toThrow(/a@b\.com/);
  });
});
