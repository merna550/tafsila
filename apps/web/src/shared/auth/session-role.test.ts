import { describe, expect, it } from "vitest";
import type { AuthClient } from "./clients";
import { readSessionRole, roleFromToken } from "./session-role";

/**
 * Builds an unsigned JWT with the given payload.
 *
 * @param payload - Claims.
 * @returns The token text.
 */
const tokenWith = (payload: unknown): string =>
  `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;

describe("roleFromToken", () => {
  it("returns admin for the admin claim", () => {
    expect(roleFromToken(tokenWith({ sub: "u1", user_role: "admin" }))).toBe("admin");
  });

  it("returns user for a user claim, a missing claim or an unknown value", () => {
    expect(roleFromToken(tokenWith({ user_role: "user" }))).toBe("user");
    expect(roleFromToken(tokenWith({ sub: "u1" }))).toBe("user");
    expect(roleFromToken(tokenWith({ user_role: "superadmin" }))).toBe("user");
  });

  it("returns user for no token or a malformed one", () => {
    expect(roleFromToken(null)).toBe("user");
    expect(roleFromToken(undefined)).toBe("user");
    expect(roleFromToken("not-a-jwt")).toBe("user");
    expect(roleFromToken("a.%%%.c")).toBe("user");
    expect(roleFromToken(`h.${Buffer.from("[1]").toString("base64url")}.s`)).toBe("user");
  });

  it("reads a payload with Arabic text", () => {
    expect(roleFromToken(tokenWith({ name: "منى", user_role: "admin" }))).toBe("admin");
  });
});

describe("readSessionRole", () => {
  const clientWith = (getSession: () => Promise<unknown>): AuthClient =>
    ({ auth: { getSession } }) as unknown as AuthClient;

  it("reads the role from the session token", async () => {
    const client = clientWith(() =>
      Promise.resolve({ data: { session: { access_token: tokenWith({ user_role: "admin" }) } } }),
    );
    expect(await readSessionRole(client)).toBe("admin");
  });

  it("is user without a session or when the call fails", async () => {
    expect(await readSessionRole(clientWith(() => Promise.resolve({ data: { session: null } })))).toBe(
      "user",
    );
    expect(await readSessionRole(clientWith(() => Promise.reject(new Error("offline"))))).toBe("user");
  });
});
