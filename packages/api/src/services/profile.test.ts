import { describe, expect, it } from "vitest";
import { createMemoryProfileRepository } from "../adapters/memory/profile-repository";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { getProfile } from "./get-profile";
import { updateProfile } from "./update-profile";

/**
 * Fresh memory dependencies per test; analytics events are collected in `events`.
 *
 * @returns The store, the dependencies and the captured events.
 */
function setup() {
  const store = createMemoryStore();
  const events: { id: string; event: string; properties: unknown }[] = [];
  const analytics = {
    capture: (id: string, event: string, properties?: unknown) => {
      events.push({ id, event, properties });
    },
  };
  return { store, events, deps: { profiles: createMemoryProfileRepository(store), analytics } };
}

const a = { ...authFor(USER_A), claims: { sub: USER_A, email: "mona@example.com" } };

describe("get profile", () => {
  it("returns the default profile with the email from the token", async () => {
    const { deps } = setup();
    expect(await getProfile(deps, a)).toEqual({ name: null, locale: "ar", email: "mona@example.com" });
  });

  it("returns a null email when the token has none", async () => {
    const { deps } = setup();
    expect((await getProfile(deps, authFor(USER_A))).email).toBeNull();
  });

  it("answers not found for a deleted account", async () => {
    const { deps, store } = setup();
    store.deletedUsers.add(USER_A);
    await expect(getProfile(deps, a)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("update profile", () => {
  it("changes the name and keeps the language", async () => {
    const { deps } = setup();
    expect(await updateProfile(deps, a, { name: "منى" })).toEqual({
      name: "منى",
      locale: "ar",
      email: "mona@example.com",
    });
  });

  it("changes the language, keeps the name and records the event without personal data", async () => {
    const { deps, events } = setup();
    await updateProfile(deps, a, { name: "منى" });
    const result = await updateProfile(deps, a, { locale: "en" });
    expect(result).toMatchObject({ name: "منى", locale: "en" });
    expect(events).toEqual([{ id: USER_A, event: "locale_changed", properties: { locale: "en" } }]);
  });

  it("changes only the caller's own profile", async () => {
    const { deps } = setup();
    await updateProfile(deps, a, { name: "منى" });
    expect((await getProfile(deps, authFor(USER_B))).name).toBeNull();
  });

  it("answers not found for a deleted account", async () => {
    const { deps, store } = setup();
    store.deletedUsers.add(USER_A);
    await expect(updateProfile(deps, a, { name: "منى" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
