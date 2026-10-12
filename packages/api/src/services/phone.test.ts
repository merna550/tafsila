/* eslint-disable sonarjs/no-hardcoded-ip -- documentation addresses stand in for client IPs */
import type { AnalyticsEventName } from "@tafsila/schemas";
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryPhoneOtp, MEMORY_OTP_CODE, type MemoryPhoneOtp } from "../adapters/memory/phone-otp";
import {
  createMemoryPhoneVerification,
  type MemoryPhoneVerification,
} from "../adapters/memory/phone-verification-repository";
import { createHmacPhoneHasher } from "../adapters/system/hmac-phone-hasher";
import type { AppError } from "../domain/errors";
import type { Analytics } from "../ports/analytics";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { getPhoneStatus } from "./get-phone-status";
import type { PhoneDeps, PhoneRules } from "./phone-shared";
import { sendPhoneCode } from "./send-phone-code";
import { verifyPhone } from "./verify-phone";

const PHONE = "+201000000005";
const START = new Date("2026-10-12T10:00:00.000Z");
const SECOND = 1000;

/** Everything a test needs: deps, handles on the fakes, the clock and the captured events. */
interface Setup {
  deps: PhoneDeps;
  otp: MemoryPhoneOtp;
  phones: MemoryPhoneVerification;
  events: { name: string; props: unknown }[];
  advance(seconds: number): void;
}

/**
 * Builds the services with memory adapters and a movable clock.
 *
 * @param rules - Environment rules.
 * @returns The setup.
 */
function setup(rules: PhoneRules = { testOnly: true, testNumbers: [PHONE, "+201000000006"] }): Setup {
  let now = START.getTime();
  const clock = { now: () => new Date(now) };
  const events: Setup["events"] = [];
  const analytics: Analytics = {
    capture: <E extends AnalyticsEventName>(_id: string, name: E, props?: unknown) => {
      events.push({ name, props });
    },
  };
  const otp = createMemoryPhoneOtp();
  const phones = createMemoryPhoneVerification(clock);
  const deps: PhoneDeps = { otp, hasher: createHmacPhoneHasher("k".repeat(32)), phones, analytics, rules };
  return { deps, otp, phones, events, advance: (s) => (now += s * SECOND) };
}

/**
 * Sends a code as a user.
 *
 * @param s - Setup.
 * @param userId - Caller.
 * @param phone - Typed number.
 * @param ip - Client IP.
 * @returns The service promise.
 */
const send = (s: Setup, userId: string, phone = "010 0000 0005", ip: string | null = "1.1.1.1") =>
  sendPhoneCode(s.deps, { ctx: authFor(userId), accessToken: "t", ip, phone });

/**
 * Verifies a code as a user.
 *
 * @param s - Setup.
 * @param userId - Caller.
 * @param code - Code typed.
 * @param ip - Client IP.
 * @returns The service promise.
 */
const verify = (s: Setup, userId: string, code = MEMORY_OTP_CODE, ip: string | null = "1.1.1.1") =>
  verifyPhone(s.deps, { ctx: authFor(userId), ip, phone: PHONE, code });

/**
 * Returns the error code a promise rejects with.
 *
 * @param promise - A promise expected to reject with an AppError.
 * @returns The error.
 */
async function failure(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    return error as AppError;
  }
  throw new Error("expected a rejection");
}

let s: Setup;
beforeEach(() => {
  s = setup();
});

describe("sendPhoneCode", () => {
  it("normalises, sends and reports the countdown; the first send is 'first', the next 'resend'", async () => {
    expect(await send(s, USER_A)).toEqual({ phone: PHONE, resendAfterSeconds: 60 });
    expect(s.otp.sent).toEqual([PHONE]);
    s.advance(61);
    await send(s, USER_A, "+201000000005");
    expect(s.events.filter((e) => e.name === "phone_code_requested").map((e) => e.props)).toEqual([
      { attempt: "first" },
      { attempt: "resend" },
    ]);
  });

  it("rejects numbers that are not Egyptian mobiles", async () => {
    expect((await failure(send(s, USER_A, "0221234567"))).code).toBe("PHONE_INVALID");
  });

  it("refuses a non-test number outside production and passes it in production", async () => {
    const outside = await failure(send(s, USER_A, "01012345678"));
    expect(outside.code).toBe("PHONE_TEST_ONLY");
    expect(s.otp.sent).toEqual([]);
    const prod = setup({ testOnly: false, testNumbers: [] });
    await send(prod, USER_A, "01012345678");
    expect(prod.otp.sent).toEqual(["+201012345678"]);
  });

  it("refuses an already verified account", async () => {
    await send(s, USER_A);
    await verify(s, USER_A);
    s.advance(120);
    expect((await failure(send(s, USER_A))).code).toBe("PHONE_ALREADY_VERIFIED");
  });

  it("refuses a number verified by another account, also after that account is deleted", async () => {
    await send(s, USER_A);
    await verify(s, USER_A);
    expect((await failure(send(s, USER_B))).code).toBe("PHONE_ALREADY_USED");
    s.phones.deleteAccount(USER_A);
    s.advance(120);
    expect((await failure(send(s, USER_B))).code).toBe("PHONE_ALREADY_USED");
    expect(s.events.some((e) => e.name === "phone_verification_failed")).toBe(true);
  });

  it("enforces the 60 second cooldown with a retry time", async () => {
    await send(s, USER_A);
    s.advance(59);
    const error = await failure(send(s, USER_A));
    expect(error.code).toBe("PHONE_RESEND_TOO_SOON");
    expect(error.details?.retryAfterSeconds).toBe(1);
    s.advance(1);
    await send(s, USER_A);
  });

  it("enforces the hourly account limit", async () => {
    for (let i = 0; i < 5; i++) {
      await send(s, USER_A);
      s.advance(61);
    }
    const error = await failure(send(s, USER_A));
    expect(error.code).toBe("PHONE_TOO_MANY_ATTEMPTS");
    expect(error.details?.retryAfterSeconds).toBeGreaterThan(60);
  });

  it("limits a number across accounts and an IP across numbers", async () => {
    const users = ["u1", "u2", "u3", "u4", "u5", "u6"];
    for (const user of users.slice(0, 5)) await send(s, user);
    expect((await failure(send(s, users[5] as string))).code).toBe("PHONE_TOO_MANY_ATTEMPTS");
  });

  it("maps a provider failure to PHONE_SEND_FAILED and lets the retry through after the cooldown", async () => {
    s.otp.failNextSend();
    expect((await failure(send(s, USER_A))).code).toBe("PHONE_SEND_FAILED");
    s.advance(60);
    await send(s, USER_A);
  });

  it("never puts the number in analytics", async () => {
    await send(s, USER_A);
    expect(JSON.stringify(s.events)).not.toMatch(/2010|010000/);
  });
});

describe("verifyPhone", () => {
  it("verifies, marks eligible for the trial and emits phone_verified without the number", async () => {
    await send(s, USER_A);
    const result = await verify(s, USER_A, "١٢٣٤٥٦");
    expect(result).toEqual({ verifiedAt: START.toISOString(), trialEligible: true });
    expect(await getPhoneStatus(s.phones, authFor(USER_A))).toEqual({
      verified: true,
      phone: PHONE,
      trialEligible: true,
    });
    expect(s.events.at(-1)).toEqual({ name: "phone_verified", props: { trial_eligible: true } });
    expect(JSON.stringify(s.events)).not.toContain("0000");
  });

  it("is not eligible once the trial was granted", async () => {
    await send(s, USER_A);
    await verify(s, USER_A);
    s.phones.grantTrial(USER_A);
    expect((await getPhoneStatus(s.phones, authFor(USER_A))).trialEligible).toBe(false);
    expect(await s.phones.isEligible(USER_A)).toBe(false);
  });

  it("rejects a wrong or malformed code and records the failure", async () => {
    await send(s, USER_A);
    expect((await failure(verify(s, USER_A, "000000"))).code).toBe("PHONE_CODE_INVALID");
    expect((await failure(verify(s, USER_A, "12"))).code).toBe("PHONE_CODE_INVALID");
    expect(s.phones.events.filter((e) => e.kind === "verify_fail")).toHaveLength(1);
    expect(s.events.some((e) => e.props && (e.props as { reason?: string }).reason === "invalid_code")).toBe(
      true,
    );
  });

  it("blocks after five wrong codes in 15 minutes, with a retry time", async () => {
    await send(s, USER_A);
    for (let i = 0; i < 5; i++) await failure(verify(s, USER_A, "000000"));
    const error = await failure(verify(s, USER_A));
    expect(error.code).toBe("PHONE_TOO_MANY_ATTEMPTS");
    expect(error.details?.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("treats a code that GoTrue attached to another user as invalid", async () => {
    await send(s, USER_A);
    s.advance(61);
    await send(s, USER_B);
    expect((await failure(verify(s, USER_A))).code).toBe("PHONE_CODE_INVALID");
  });

  it("lets two accounts race: the second confirm gets PHONE_ALREADY_USED", async () => {
    await send(s, USER_A);
    await verify(s, USER_A);
    await send(s, USER_B).catch(() => undefined);
    await s.otp.send({ userId: USER_B, accessToken: "t" }, PHONE);
    expect((await failure(verify(s, USER_B))).code).toBe("PHONE_ALREADY_USED");
  });

  it("does not block a correct code by the IP limit alone, but refuses a wrong one", async () => {
    const ips = "9.9.9.9";
    for (let i = 0; i < 50; i++) {
      await s.phones.attempt({
        kind: "verify_fail",
        userId: `other${i}`,
        phoneHash: new Uint8Array([i]),
        ipHash: s.deps.hasher.ip(ips),
        rules: [],
        record: true,
      });
    }
    await send(s, USER_A, "010 0000 0005", ips);
    s.advance(61);
    expect((await failure(verify(s, USER_A, "000000", ips))).code).toBe("PHONE_TOO_MANY_ATTEMPTS");
    expect((await verify(s, USER_A, MEMORY_OTP_CODE, ips)).trialEligible).toBe(true);
  });

  it("refuses an invalid number and an already verified account", async () => {
    expect(
      (await failure(verifyPhone(s.deps, { ctx: authFor(USER_A), ip: null, phone: "123", code: "123456" })))
        .code,
    ).toBe("PHONE_INVALID");
    await send(s, USER_A);
    await verify(s, USER_A);
    expect((await failure(verify(s, USER_A))).code).toBe("PHONE_ALREADY_VERIFIED");
  });
});
