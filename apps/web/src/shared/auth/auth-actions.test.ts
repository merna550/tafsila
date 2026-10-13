import { describe, expect, it, vi } from "vitest";
import { clearLocalSession, getAccessToken, requestReset, signIn, signOut, signUp } from "./auth-actions";
import type { AuthClient } from "./clients";

/**
 * Builds a fake auth client whose methods all return the given value.
 *
 * @param result - What every auth call resolves to.
 * @returns The fake client and its auth spies.
 */
function fakeClient(result: unknown) {
  const auth = {
    signUp: vi.fn().mockResolvedValue(result),
    signInWithPassword: vi.fn().mockResolvedValue(result),
    signInWithOAuth: vi.fn().mockResolvedValue(result),
    resetPasswordForEmail: vi.fn().mockResolvedValue(result),
    updateUser: vi.fn().mockResolvedValue(result),
    signOut: vi.fn().mockResolvedValue(result),
    getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "tok" } } }),
  };
  return { auth, client: { auth } as unknown as AuthClient };
}

describe("auth actions", () => {
  it("return ok when Supabase reports no error", async () => {
    const { client, auth } = fakeClient({ error: null });
    await expect(signIn(client, { email: "a@b.co", password: "12345678" })).resolves.toEqual({ ok: true });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.co", password: "12345678" });
    await expect(signUp(client, { email: "a@b.co", password: "12345678" }, "/x")).resolves.toEqual({
      ok: true,
    });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@b.co",
      password: "12345678",
      options: { emailRedirectTo: "/x" },
    });
    await expect(requestReset(client, "a@b.co", "/r")).resolves.toEqual({ ok: true });
    await expect(signOut(client)).resolves.toEqual({ ok: true });
  });

  it("return a mapped ApiError when Supabase reports an error", async () => {
    const { client } = fakeClient({ error: { code: "over_request_rate_limit", status: 429 } });
    const result = await signOut(client);
    expect(result).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
  });

  it("map a thrown failure too", async () => {
    const { client, auth } = fakeClient(null);
    auth.signOut.mockRejectedValue({ name: "AuthRetryableFetchError", status: 0 });
    expect(await signOut(client)).toMatchObject({ ok: false, error: { code: "NETWORK_ERROR" } });
  });

  it("getAccessToken returns the session token, or null when signed out", async () => {
    const { client } = fakeClient({ error: null });
    expect(await getAccessToken(client)).toBe("tok");
    const out = {
      auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    } as unknown as AuthClient;
    expect(await getAccessToken(out)).toBeNull();
  });
});

describe("clearLocalSession", () => {
  it("signs out with the local scope only", async () => {
    const { client, auth } = fakeClient({ error: null });
    await clearLocalSession(client);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("ignores the error a vanished user causes", async () => {
    const { client, auth } = fakeClient({ error: null });
    auth.signOut.mockRejectedValue(new Error("user not found"));
    await expect(clearLocalSession(client)).resolves.toBeUndefined();
  });
});
