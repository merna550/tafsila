import { describe, expect, it } from "vitest";
import { createMemoryAccountDeletion } from "../adapters/memory/account-deletion";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { deleteAccount } from "./delete-account";

/**
 * Fresh memory dependencies per test with one client and one file for each of two users.
 *
 * @returns The store, the fakes, the dependencies and the reported errors.
 */
function setup() {
  const store = createMemoryStore();
  const fakes = createMemoryAccountDeletion(store);
  const reported: unknown[] = [];
  for (const ownerId of [USER_A, USER_B]) {
    store.clients.push({
      id: `client-${ownerId}`,
      ownerId,
      name: "Client",
      notes: null,
      createdAt: "2026-10-12T10:00:00.000Z",
    });
    fakes.files.set(ownerId, ["photo.png"]);
  }
  const deps = {
    ...fakes,
    errorReporter: {
      captureException: (error: unknown) => {
        reported.push(error);
      },
      setUser: () => undefined,
    },
  };
  return { store, fakes, deps, reported };
}

describe("delete account", () => {
  it("runs files, analytics, sign-in account and audit in that order", async () => {
    const { deps, fakes } = setup();
    await deleteAccount(deps, authFor(USER_A), "req-1");
    expect(fakes.calls).toEqual([`files:${USER_A}`, `identity:${USER_A}`, `deleter:${USER_A}`, "audit"]);
  });

  it("removes the user's data and leaves other users untouched", async () => {
    const { deps, fakes, store } = setup();
    await deleteAccount(deps, authFor(USER_A), "req-1");
    expect(store.clients.map((c) => c.ownerId)).toEqual([USER_B]);
    expect(fakes.files.has(USER_A)).toBe(false);
    expect(fakes.files.has(USER_B)).toBe(true);
  });

  it("calls the audit step without any argument so no id can reach the audit row", async () => {
    const { deps, fakes } = setup();
    await deleteAccount(deps, authFor(USER_A), "req-1");
    expect(fakes.calls.at(-1)).toBe("audit");
  });

  it.each([
    ["files", ["files:" + USER_A]],
    ["identity", ["files:" + USER_A, "identity:" + USER_A]],
  ] as const)("stops before the sign-in account when %s fails and keeps the account", async (step, calls) => {
    const { deps, fakes, store } = setup();
    fakes.failAt(step);
    await expect(deleteAccount(deps, authFor(USER_A), "req-1")).rejects.toThrow(`${step} failed`);
    expect(fakes.calls).toEqual(calls);
    expect(store.clients).toHaveLength(2);
    expect(store.deletedUsers.has(USER_A)).toBe(false);
  });

  it("fails and writes no audit row when the sign-in account cannot be deleted", async () => {
    const { deps, fakes } = setup();
    fakes.failAt("deleter");
    await expect(deleteAccount(deps, authFor(USER_A), "req-1")).rejects.toThrow("deleter failed");
    expect(fakes.calls).not.toContain("audit");
  });

  it("still succeeds and reports the error when the audit write fails", async () => {
    const { deps, fakes, reported, store } = setup();
    fakes.failAt("audit");
    await expect(deleteAccount(deps, authFor(USER_A), "req-1")).resolves.toBeUndefined();
    expect(reported).toHaveLength(1);
    expect(store.deletedUsers.has(USER_A)).toBe(true);
  });

  it("completes when repeated after a failure in the middle", async () => {
    const { deps, fakes, store } = setup();
    fakes.failAt("deleter");
    await expect(deleteAccount(deps, authFor(USER_A), "req-1")).rejects.toThrow();
    fakes.failAt(undefined);
    await deleteAccount(deps, authFor(USER_A), "req-2");
    expect(store.deletedUsers.has(USER_A)).toBe(true);
  });

  it("refuses an admin and calls nothing", async () => {
    const { deps, fakes } = setup();
    await expect(deleteAccount(deps, { ...authFor(USER_A), role: "admin" }, "req-1")).rejects.toMatchObject({
      code: "ACCOUNT_DELETE_FORBIDDEN",
    });
    expect(fakes.calls).toEqual([]);
  });
});
