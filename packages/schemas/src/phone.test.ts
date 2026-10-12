import { describe, expect, it } from "vitest";
import {
  phoneStatusResponseSchema,
  sendPhoneCodeBodySchema,
  verifyPhoneBodySchema,
  verifyPhoneResponseSchema,
} from "./phone";

describe("phone schemas", () => {
  it("trims the number and ignores nothing else", () => {
    expect(sendPhoneCodeBodySchema.parse({ phone: " 010 0000 0005 " })).toEqual({ phone: "010 0000 0005" });
  });

  it("rejects extra fields such as a userId", () => {
    expect(sendPhoneCodeBodySchema.safeParse({ phone: "0100", userId: "x" }).success).toBe(false);
    expect(verifyPhoneBodySchema.safeParse({ phone: "0100", code: "1", userId: "x" }).success).toBe(false);
  });

  it("rejects an empty number or code", () => {
    expect(sendPhoneCodeBodySchema.safeParse({ phone: "  " }).success).toBe(false);
    expect(verifyPhoneBodySchema.safeParse({ phone: "0100", code: "" }).success).toBe(false);
  });

  it("describes the responses", () => {
    expect(
      verifyPhoneResponseSchema.parse({ verifiedAt: "2026-10-12T10:00:00.000Z", trialEligible: true })
        .trialEligible,
    ).toBe(true);
    expect(
      phoneStatusResponseSchema.parse({ verified: false, phone: null, trialEligible: false }).phone,
    ).toBeNull();
  });
});
