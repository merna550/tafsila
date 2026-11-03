import type { AnalyticsEventName } from "@tafsila/schemas";
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryBilling, type MemoryBilling } from "../adapters/memory/billing-repository";
import { createMemoryPhoneOtp, MEMORY_OTP_CODE } from "../adapters/memory/phone-otp";
import {
  createMemoryPhoneVerification,
  type MemoryPhoneVerification,
} from "../adapters/memory/phone-verification-repository";
import { createHmacPhoneHasher } from "../adapters/system/hmac-phone-hasher";
import { TRIAL_CREDITS } from "../domain/billing";
import { defaultPlanLimits, canAddClient } from "../domain/plan-limits";
import type { Analytics } from "../ports/analytics";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { createClient } from "./create-client";
import { getCredits, type GetCreditsDeps } from "./get-credits";
import { listProducts } from "./list-products";
import type { PhoneDeps } from "./phone-shared";
import { verifyPhone } from "./verify-phone";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { createMemoryClientRepository } from "../adapters/memory/client-repository";

const PHONE = "+201000000005";
const NOW = new Date("2026-11-01T00:00:00.000Z");
const DAY = 86_400_000;

interface Setup {
  phones: MemoryPhoneVerification;
  billing: MemoryBilling;
  deps: GetCreditsDeps;
  phoneDeps: PhoneDeps;
  events: { name: string; props: unknown }[];
}

/**
 * Builds billing and phone services over memory adapters with a fixed clock.
 *
 * @returns The setup.
 */
function setup(): Setup {
  const clock = { now: () => NOW };
  const events: Setup["events"] = [];
  const analytics: Analytics = {
    capture: <E extends AnalyticsEventName>(_id: string, name: E, props?: unknown) => {
      events.push({ name, props });
    },
  };
  const phones = createMemoryPhoneVerification(clock);
  const billing = createMemoryBilling({ clock, phones, chatPerDesign: 10 });
  const phoneDeps: PhoneDeps = {
    otp: createMemoryPhoneOtp(),
    hasher: createHmacPhoneHasher("k".repeat(32)),
    phones,
    analytics,
    rules: { testOnly: true, testNumbers: [PHONE] },
  };
  return { phones, billing, events, phoneDeps, deps: { billing, planLimits: billing, clock, analytics } };
}

/**
 * Verifies the test number for a user.
 *
 * @param s - Setup.
 * @param userId - Caller.
 * @returns The service promise.
 */
async function verify(s: Setup, userId: string) {
  await s.phoneDeps.otp.send({ ...authFor(userId), accessToken: "t" }, PHONE);
  return verifyPhone(s.phoneDeps, { ctx: authFor(userId), ip: null, phone: PHONE, code: MEMORY_OTP_CODE });
}

describe("trial grant at verification", () => {
  let s: Setup;
  beforeEach(() => {
    s = setup();
  });

  it("gives 3 credits and captures trial_granted once", async () => {
    await verify(s, USER_A);
    expect((await s.billing.summary(USER_A)).balance).toBe(TRIAL_CREDITS);
    expect(s.events.filter((e) => e.name === "trial_granted")).toEqual([
      { name: "trial_granted", props: { source: "verify" } },
    ]);
    await getCredits(s.deps, authFor(USER_A));
    expect(s.events.filter((e) => e.name === "trial_granted")).toHaveLength(1);
  });

  it("refuses a second account with the same number and grants nothing", async () => {
    await verify(s, USER_A);
    await expect(verify(s, USER_B)).rejects.toMatchObject({ code: "PHONE_ALREADY_USED" });
    expect((await s.billing.summary(USER_B)).balance).toBe(0);
  });
});

describe("getCredits", () => {
  it("grants the trial lazily to a user verified before M7, once", async () => {
    const s = setup();
    s.phones.verifyWithoutTrial(USER_A, PHONE, new Uint8Array([1]));
    expect((await getCredits(s.deps, authFor(USER_A))).balance).toBe(TRIAL_CREDITS);
    expect((await getCredits(s.deps, authFor(USER_A))).balance).toBe(TRIAL_CREDITS);
    expect(s.events).toEqual([{ name: "trial_granted", props: { source: "lazy" } }]);
  });

  it("gives an unverified user nothing and default limits", async () => {
    const s = setup();
    expect(await getCredits(s.deps, authFor(USER_A))).toEqual({
      balance: 0,
      grants: [],
      plan: null,
      limits: { maxClients: 10, chatPerDesign: 10 },
    });
  });

  it("lists grants by expiry, ignores expired lots and never shows another user's credits", async () => {
    const s = setup();
    s.billing.grantLot(USER_A, 3, null);
    s.billing.grantLot(USER_A, 5, new Date(NOW.getTime() + 10 * DAY));
    s.billing.grantLot(USER_A, 4, new Date(NOW.getTime() - DAY));
    s.billing.grantLot(USER_B, 9, null);
    const result = await getCredits(s.deps, authFor(USER_A));
    expect(result.balance).toBe(8);
    expect(result.grants).toEqual([
      { credits: 5, expiresAt: new Date(NOW.getTime() + 10 * DAY).toISOString() },
      { credits: 3, expiresAt: null },
    ]);
  });

  it.each([
    [8, false],
    [7, true],
    [1, true],
  ])("renewSoon at %i days left is %s", async (days, expected) => {
    const s = setup();
    s.billing.setPlan(USER_A, {
      code: "hobby",
      periodEnd: new Date(NOW.getTime() + days * DAY),
      maxClients: 10,
      chatPerDesign: 10,
    });
    expect((await getCredits(s.deps, authFor(USER_A))).plan?.renewSoon).toBe(expected);
  });

  it("returns unlimited clients on Pro and ignores a plan whose period is over", async () => {
    const s = setup();
    s.billing.setPlan(USER_A, {
      code: "pro",
      periodEnd: new Date(NOW.getTime() + 20 * DAY),
      maxClients: null,
      chatPerDesign: 20,
    });
    expect((await getCredits(s.deps, authFor(USER_A))).limits).toEqual({
      maxClients: null,
      chatPerDesign: 20,
    });
    s.billing.setPlan(USER_A, {
      code: "pro",
      periodEnd: new Date(NOW.getTime() - DAY),
      maxClients: null,
      chatPerDesign: 20,
    });
    const lapsed = await getCredits(s.deps, authFor(USER_A));
    expect(lapsed.plan).toBeNull();
    expect(lapsed.limits).toEqual(defaultPlanLimits(10));
  });
});

describe("plan limits and clients", () => {
  it("refuses the 11th client without a plan and allows 500 on Pro", async () => {
    const s = setup();
    const clients = createMemoryClientRepository(createMemoryStore());
    const deps = { clients, planLimits: s.billing };
    for (let i = 0; i < 10; i += 1) await createClient(deps, authFor(USER_A), { name: `C${String(i)}` });
    await expect(createClient(deps, authFor(USER_A), { name: "C10" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(canAddClient(await s.billing.limits(authFor(USER_A)), 500)).toBe(false);
    s.billing.setPlan(USER_A, {
      code: "pro",
      periodEnd: new Date(NOW.getTime() + DAY),
      maxClients: null,
      chatPerDesign: 20,
    });
    expect(canAddClient(await s.billing.limits(authFor(USER_A)), 500)).toBe(true);
  });
});

describe("listProducts", () => {
  it("returns only active products, cheapest first", async () => {
    const s = setup();
    const single = s.billing.products.find((p) => p.code === "single");
    if (single) single.active = false;
    const { items } = await listProducts(s.billing, authFor(USER_A));
    expect(items.map((p) => p.code)).toEqual(["hobby", "pack5", "pro"]);
    expect(items[0]).not.toHaveProperty("active");
  });
});
