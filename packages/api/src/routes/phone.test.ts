/* eslint-disable @typescript-eslint/unbound-method -- `call` is a closure from createMemoryApp, not a class method */
import { describe, expect, it } from "vitest";
import { createMemoryApp, USER_A } from "../test-support/memory-app";

const CODE_PATH = "/phone/code";

describe("phone routes", () => {
  it.each([
    ["GET", "/phone"],
    ["POST", CODE_PATH],
    ["POST", "/phone/verify"],
  ])("%s %s needs a token", async (method, path) => {
    const { call } = await createMemoryApp();
    const res = await call(
      undefined,
      method,
      path,
      method === "POST" ? { phone: "0100", code: "1" } : undefined,
    );
    expect(res.status).toBe(401);
  });

  it("runs the whole flow: status, send, verify, status", async () => {
    const { call, phoneOtp } = await createMemoryApp();
    expect(await (await call(USER_A, "GET", "/phone")).json()).toEqual({
      verified: false,
      phone: null,
      trialEligible: false,
    });
    const sent = await call(USER_A, "POST", CODE_PATH, { phone: "010 0000 0005" });
    expect(sent.status).toBe(202);
    expect(await sent.json()).toEqual({ phone: "+201000000005", resendAfterSeconds: 60 });
    expect(phoneOtp.sent).toEqual(["+201000000005"]);
    const verified = await call(USER_A, "POST", "/phone/verify", { phone: "+201000000005", code: "123456" });
    expect(verified.status).toBe(200);
    expect(((await verified.json()) as { trialEligible: boolean }).trialEligible).toBe(true);
    expect(await (await call(USER_A, "GET", "/phone")).json()).toEqual({
      verified: true,
      phone: "+201000000005",
      trialEligible: true,
    });
  });

  it("answers 400 with the Arabic PHONE_INVALID message", async () => {
    const { call } = await createMemoryApp();
    const res = await call(USER_A, "POST", CODE_PATH, { phone: "0221234567" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string; message_ar: string };
    expect(body.code).toBe("PHONE_INVALID");
    expect(body.message_ar).toContain("010");
  });

  it("sets Retry-After on a 429", async () => {
    const { call } = await createMemoryApp();
    await call(USER_A, "POST", CODE_PATH, { phone: "0100 000 0005" });
    const res = await call(USER_A, "POST", CODE_PATH, { phone: "01000000005" });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    const body = (await res.json()) as { code: string; details: { retryAfterSeconds: number } };
    expect(body.code).toBe("PHONE_RESEND_TOO_SOON");
    expect(body.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("ignores a userId in the body (strict schema) and never trusts it", async () => {
    const { call } = await createMemoryApp();
    const res = await call(USER_A, "POST", CODE_PATH, { phone: "01000000005", userId: "someone-else" });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe("VALIDATION_FAILED");
  });

  it("refuses a non-test number with PHONE_TEST_ONLY", async () => {
    const { call } = await createMemoryApp();
    const res = await call(USER_A, "POST", CODE_PATH, { phone: "01012345678" });
    expect(((await res.json()) as { code: string }).code).toBe("PHONE_TEST_ONLY");
  });
});
