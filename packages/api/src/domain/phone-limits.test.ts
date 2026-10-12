import { describe, expect, it } from "vitest";
import {
  evaluateLimits as evaluateQuery,
  SEND_LIMITS,
  sendLimitErrorCode,
  VERIFY_FAIL_LIMITS,
  type LimitEvent,
} from "./phone-limits";

const NOW = new Date("2026-10-12T10:00:00.000Z");
const keys = { userId: "a", phoneHash: "h1", ipHash: "i1" };

/**
 * Evaluates with the positional form the tests read best in.
 *
 * @param events - Recorded events.
 * @param kind - Event kind.
 * @param who - Who attempts.
 * @param rules - Rules.
 * @returns The attempt result.
 */
function evaluateLimits(
  events: readonly LimitEvent[],
  kind: "send" | "verify_fail",
  who: typeof keys | { userId: string; phoneHash: string; ipHash: null },
  rules: typeof SEND_LIMITS,
) {
  return evaluateQuery(events, { kind, keys: who, rules }, NOW);
}

/**
 * Builds a send event some seconds before NOW.
 *
 * @param secondsAgo - Age of the event.
 * @param over - Fields to replace.
 * @returns The event.
 */
function sendEvent(secondsAgo: number, over: Partial<LimitEvent> = {}): LimitEvent {
  return {
    kind: "send",
    userId: "a",
    phoneHash: "h1",
    ipHash: "i1",
    at: new Date(NOW.getTime() - secondsAgo * 1000),
    ...over,
  };
}

describe("evaluateLimits", () => {
  it("allows when there are no events", () => {
    expect(evaluateLimits([], "send", keys, SEND_LIMITS).allowed).toBe(true);
  });

  it("blocks at 59 seconds and allows at 60 seconds (cooldown edge)", () => {
    const blocked = evaluateLimits([sendEvent(59)], "send", keys, SEND_LIMITS);
    expect(blocked).toMatchObject({
      allowed: false,
      retryAfterSeconds: 1,
      scope: "account",
      windowSeconds: 60,
    });
    expect(sendLimitErrorCode(blocked)).toBe("PHONE_RESEND_TOO_SOON");
    expect(evaluateLimits([sendEvent(60)], "send", keys, SEND_LIMITS).allowed).toBe(true);
  });

  it("blocks the sixth send in an hour and reports the time until the oldest leaves", () => {
    const events = [3000, 2000, 1000, 500, 100].map((s) => sendEvent(s));
    const result = evaluateLimits(events, "send", keys, SEND_LIMITS);
    expect(result).toMatchObject({
      allowed: false,
      retryAfterSeconds: 600,
      scope: "account",
      windowSeconds: 3600,
    });
    expect(sendLimitErrorCode(result)).toBe("PHONE_TOO_MANY_ATTEMPTS");
  });

  it("counts the day window", () => {
    const events = Array.from({ length: 10 }, (_, i) => sendEvent(4000 + i * 100));
    const result = evaluateLimits(events, "send", keys, SEND_LIMITS);
    expect(result).toMatchObject({ allowed: false, windowSeconds: 86_400 });
  });

  it("does not let another account's events block the account scope but counts the shared number and ip", () => {
    const others = Array.from({ length: 5 }, (_, i) => sendEvent(100 + i, { userId: "b" }));
    expect(
      evaluateLimits(
        others,
        "send",
        keys,
        SEND_LIMITS.filter((r) => r.scope === "account"),
      ).allowed,
    ).toBe(true);
    expect(evaluateLimits(others, "send", keys, SEND_LIMITS)).toMatchObject({
      allowed: false,
      scope: "number",
    });
    const viaIp = Array.from({ length: 30 }, (_, i) =>
      sendEvent(100 + i, { userId: "b", phoneHash: `x${i}` }),
    );
    expect(evaluateLimits(viaIp, "send", keys, SEND_LIMITS)).toMatchObject({
      allowed: false,
      scope: "ip",
    });
  });

  it("separates the kinds and counts prior events", () => {
    const fail: LimitEvent = { ...sendEvent(10), kind: "verify_fail" };
    expect(evaluateLimits([fail], "send", keys, SEND_LIMITS)).toMatchObject({
      allowed: true,
      priorEvents: 0,
    });
    expect(evaluateLimits([sendEvent(120)], "send", keys, SEND_LIMITS)).toMatchObject({
      allowed: true,
      priorEvents: 1,
    });
  });

  it("applies the wrong-code limits", () => {
    const fails = Array.from({ length: 5 }, (_, i): LimitEvent => ({
      ...sendEvent(10 + i),
      kind: "verify_fail",
    }));
    expect(evaluateLimits(fails, "verify_fail", keys, VERIFY_FAIL_LIMITS)).toMatchObject({
      allowed: false,
      scope: "account",
    });
  });

  it("ignores the ip scope when the ip is unknown", () => {
    const events = Array.from({ length: 30 }, (_, i) =>
      sendEvent(100 + i, { userId: "b", phoneHash: `x${i}`, ipHash: null }),
    );
    expect(evaluateLimits(events, "send", { ...keys, ipHash: null }, SEND_LIMITS).allowed).toBe(true);
  });
});
