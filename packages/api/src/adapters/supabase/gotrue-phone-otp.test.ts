import { describe, expect, it } from "vitest";
import { createGotruePhoneOtp } from "./gotrue-phone-otp";

/**
 * Builds a fake fetch that answers once and records the request.
 *
 * @param status - HTTP status to answer.
 * @param body - JSON body to answer.
 * @returns The fake and the recorded calls.
 */
function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const caller = { userId: "u1", accessToken: "tok" };
const base = { supabaseUrl: "http://127.0.0.1:54321/", anonKey: "anon" };

describe("gotrue phone otp", () => {
  it("sends with PUT /auth/v1/user using the caller's token", async () => {
    const { calls, fetchImpl } = fakeFetch(200, { id: "u1" });
    await createGotruePhoneOtp({ ...base, fetchImpl }).send(caller, "+201000000005");
    expect(calls[0]?.url).toBe("http://127.0.0.1:54321/auth/v1/user");
    expect(calls[0]?.init.method).toBe("PUT");
    expect(calls[0]?.init.headers).toMatchObject({ apikey: "anon", authorization: "Bearer tok" });
    expect(calls[0]?.init.body).toBe(JSON.stringify({ phone: "+201000000005" }));
  });

  it.each([
    [422, { error_code: "phone_exists" }, "PHONE_ALREADY_USED"],
    [429, { error_code: "over_sms_send_rate_limit" }, "PHONE_TOO_MANY_ATTEMPTS"],
    [500, { error_code: "sms_send_failed" }, "PHONE_SEND_FAILED"],
  ])("maps a send failure %s %j to %s", async (status, body, code) => {
    const { fetchImpl } = fakeFetch(status, body);
    await expect(
      createGotruePhoneOtp({ ...base, fetchImpl }).send(caller, "+201000000005"),
    ).rejects.toMatchObject({ code });
  });

  it("verifies with POST /auth/v1/verify and returns only the user id", async () => {
    const { calls, fetchImpl } = fakeFetch(200, { access_token: "secret", user: { id: "u1" } });
    const result = await createGotruePhoneOtp({ ...base, fetchImpl }).verify("+201000000005", "123456");
    expect(result).toEqual({ userId: "u1" });
    expect(calls[0]?.url).toBe("http://127.0.0.1:54321/auth/v1/verify");
    expect(calls[0]?.init.body).toBe(
      JSON.stringify({ type: "phone_change", phone: "+201000000005", token: "123456" }),
    );
  });

  it.each(["otp_expired", "invalid_otp"])("maps %s to PHONE_CODE_INVALID", async (error_code) => {
    const { fetchImpl } = fakeFetch(403, { error_code });
    await expect(
      createGotruePhoneOtp({ ...base, fetchImpl }).verify("+201000000005", "000000"),
    ).rejects.toMatchObject({
      code: "PHONE_CODE_INVALID",
    });
  });

  it("treats a response without a user id and a network failure as failures", async () => {
    const { fetchImpl } = fakeFetch(200, {});
    await expect(
      createGotruePhoneOtp({ ...base, fetchImpl }).verify("+201000000005", "1"),
    ).rejects.toMatchObject({
      code: "PHONE_CODE_INVALID",
    });
    const broken = (() => Promise.reject(new Error("down"))) as unknown as typeof fetch;
    await expect(
      createGotruePhoneOtp({ ...base, fetchImpl: broken }).send(caller, "+201000000005"),
    ).rejects.toMatchObject({
      code: "PHONE_SEND_FAILED",
    });
  });
});
