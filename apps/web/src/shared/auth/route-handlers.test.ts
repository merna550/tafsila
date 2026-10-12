import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
const exchangeCodeForSession = vi.fn();

vi.mock("@tafsila/config", () => ({
  loadPublicConfig: () => ({ supabaseUrl: "http://supabase.test", supabaseAnonKey: "anon" }),
}));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ getAll: () => [], set: vi.fn() }) }));
vi.mock("./clients", () => ({
  createServerAuthClient: () => ({ auth: { verifyOtp, exchangeCodeForSession } }),
}));

const { handleCallback, handleConfirm } = await import("./route-handlers");

/**
 * Builds a request to one of the auth handlers.
 *
 * @param path - Path and query.
 * @returns The request.
 */
function request(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`);
}

/**
 * Reads where a redirect response points.
 *
 * @param response - A redirect response.
 * @returns Path and query of the target.
 */
function target(response: Response): string {
  const url = new URL(response.headers.get("location") ?? "");
  return url.pathname + url.search;
}

beforeEach(() => {
  verifyOtp.mockReset();
  exchangeCodeForSession.mockReset();
});

describe("handleConfirm", () => {
  it("sends a confirmed sign-up to the phone screen, which continues to the dashboard welcome", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const response = await handleConfirm(request("/auth/confirm?token_hash=abc&type=email"));
    expect(verifyOtp).toHaveBeenCalledWith({ type: "email", token_hash: "abc" });
    expect(target(response)).toBe("/verify?next=%2Fdashboard%3Fwelcome%3D1");
  });

  it("sends a recovery link to the reset form", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const response = await handleConfirm(request("/auth/confirm?token_hash=abc&type=recovery"));
    expect(target(response)).toBe("/reset-password");
  });

  it("sends an expired link to sign-in with the link notice", async () => {
    verifyOtp.mockResolvedValue({ error: { code: "otp_expired" } });
    const response = await handleConfirm(request("/auth/confirm?token_hash=abc&type=email"));
    expect(target(response)).toBe("/sign-in?error=link");
  });

  it.each(["/auth/confirm", "/auth/confirm?token_hash=abc", "/auth/confirm?token_hash=abc&type=magiclink"])(
    "rejects the malformed link %s without calling Supabase",
    async (path) => {
      const response = await handleConfirm(request(path));
      expect(target(response)).toBe("/sign-in?error=link");
      expect(verifyOtp).not.toHaveBeenCalled();
    },
  );
});

describe("handleCallback", () => {
  it("opens the session and follows a safe next", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { created_at: "2020-01-01T00:00:00Z" } },
      error: null,
    });
    const response = await handleCallback(request("/auth/callback?code=c1&next=%2Fdashboard"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("c1");
    expect(target(response)).toBe("/dashboard");
  });

  it("never follows an off-site next", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { created_at: "2020-01-01T00:00:00Z" } },
      error: null,
    });
    const response = await handleCallback(request("/auth/callback?code=c1&next=https%3A%2F%2Fevil.com"));
    expect(target(response)).toBe("/dashboard");
  });

  it("sends a failed exchange or a missing code to sign-in with the link notice", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { code: "flow_state_not_found" },
    });
    expect(target(await handleCallback(request("/auth/callback?code=c1")))).toBe("/sign-in?error=link");
    expect(target(await handleCallback(request("/auth/callback")))).toBe("/sign-in?error=link");
  });
});
