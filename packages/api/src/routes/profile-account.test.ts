import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

let m: MemoryApp;

beforeEach(async () => {
  m = await createMemoryApp();
});

describe("without a token", () => {
  it.each([
    ["GET", "/profile", undefined],
    ["PATCH", "/profile", { name: "منى" }],
    ["DELETE", "/account", { confirm: "DELETE_MY_ACCOUNT" }],
  ] as const)("%s %s answers 401", async (method, path, body) => {
    const res = await m.call(undefined, method, path, body);
    expect(res.status).toBe(401);
    expect(((await res.json()) as { code: string }).code).toBe("UNAUTHENTICATED");
  });
});

describe("GET and PATCH /api/profile", () => {
  it("returns the profile with the email from the token", async () => {
    const res = await m.callAs({ userId: USER_A, email: "mona@example.com" }, "GET", "/profile");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: null, locale: "ar", email: "mona@example.com" });
  });

  it("changes the name and the language and shows them on the next read", async () => {
    const patch = await m.call(USER_A, "PATCH", "/profile", { name: "  منى  ", locale: "en" });
    expect(patch.status).toBe(200);
    const read = await m.call(USER_A, "GET", "/profile");
    expect(await read.json()).toMatchObject({ name: "منى", locale: "en" });
  });

  it("never changes another user's profile", async () => {
    await m.call(USER_A, "PATCH", "/profile", { name: "منى" });
    const other = await m.call(USER_B, "GET", "/profile");
    expect(await other.json()).toMatchObject({ name: null });
  });

  it.each([{}, { name: "" }, { locale: "fr" }, { name: "منى", userId: USER_B }, { name: "x".repeat(121) }])(
    "rejects the body %j with VALIDATION_FAILED",
    async (body) => {
      const res = await m.call(USER_A, "PATCH", "/profile", body);
      expect(res.status).toBe(400);
      expect(((await res.json()) as { code: string }).code).toBe("VALIDATION_FAILED");
    },
  );
});

describe("DELETE /api/account", () => {
  it("answers 204 and deletes the caller's account and data only", async () => {
    await m.call(USER_A, "PATCH", "/profile", { name: "منى" });
    await m.call(USER_B, "PATCH", "/profile", { name: "سارة" });
    const res = await m.call(USER_A, "DELETE", "/account", { confirm: "DELETE_MY_ACCOUNT" });
    expect(res.status).toBe(204);
    expect(m.deletion.calls).toContain(`deleter:${USER_A}`);
    expect(m.deletion.calls).not.toContain(`deleter:${USER_B}`);
    expect((await m.call(USER_A, "GET", "/profile")).status).toBe(404);
    expect((await m.call(USER_B, "GET", "/profile")).status).toBe(200);
  });

  it.each([{}, { confirm: "yes" }, { confirm: "delete_my_account" }])(
    "rejects the body %j with VALIDATION_FAILED and deletes nothing",
    async (body) => {
      const res = await m.call(USER_A, "DELETE", "/account", body);
      expect(res.status).toBe(400);
      expect(m.deletion.calls).toEqual([]);
    },
  );

  it("ignores a user id in the body by refusing it", async () => {
    const res = await m.call(USER_A, "DELETE", "/account", { confirm: "DELETE_MY_ACCOUNT", userId: USER_B });
    expect(res.status).toBe(400);
    expect(m.deletion.calls).toEqual([]);
  });

  it("answers 403 ACCOUNT_DELETE_FORBIDDEN for an admin and deletes nothing", async () => {
    const res = await m.callAs({ userId: USER_A, role: "admin" }, "DELETE", "/account", {
      confirm: "DELETE_MY_ACCOUNT",
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("ACCOUNT_DELETE_FORBIDDEN");
    expect(m.deletion.calls).toEqual([]);
  });

  it("answers 500 and keeps the account when a step fails before the sign-in account is deleted", async () => {
    m.deletion.failAt("files");
    const res = await m.call(USER_A, "DELETE", "/account", { confirm: "DELETE_MY_ACCOUNT" });
    expect(res.status).toBe(500);
    expect((await m.call(USER_A, "GET", "/profile")).status).toBe(200);
  });
});
