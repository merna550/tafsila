import { describe, expect, it } from "vitest";
import type { AuthClient } from "./clients";
import { readSessionUser } from "./session-user";

const clientWith = (getUser: () => Promise<unknown>): AuthClient =>
  ({ auth: { getUser } }) as unknown as AuthClient;

describe("readSessionUser", () => {
  it("returns the verified user", async () => {
    const client = clientWith(() =>
      Promise.resolve({ data: { user: { id: "u1", email: "a@b.co" } }, error: null }),
    );
    expect(await readSessionUser(client)).toEqual({ id: "u1", email: "a@b.co" });
  });

  it("returns null for no session, an error, or a network failure", async () => {
    expect(
      await readSessionUser(clientWith(() => Promise.resolve({ data: { user: null }, error: {} }))),
    ).toBeNull();
    expect(
      await readSessionUser(clientWith(() => Promise.resolve({ data: { user: null }, error: null }))),
    ).toBeNull();
    expect(await readSessionUser(clientWith(() => Promise.reject(new Error("offline"))))).toBeNull();
  });
});
