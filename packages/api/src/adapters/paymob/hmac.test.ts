import { describe, expect, it } from "vitest";
import sample from "./__fixtures__/paymob-callback.json";
import { PAYMOB_HMAC_FIELDS, computeHmac, signedText, verifyHmac } from "./hmac";

const text = signedText(sample.transaction)!;

describe("Paymob HMAC", () => {
  it("accepts the recorded sample callback", () => {
    expect(verifyHmac(text, sample.secret, sample.hmac)).toBe(true);
    expect(verifyHmac(text, sample.secret, sample.hmac.toUpperCase())).toBe(true);
  });

  it("refuses when one field changes", () => {
    const changed = { ...sample.transaction, amount_cents: 1 };
    expect(verifyHmac(signedText(changed)!, sample.secret, sample.hmac)).toBe(false);
    const nested = { ...sample.transaction, order: { ...sample.transaction.order, id: 1 } };
    expect(verifyHmac(signedText(nested)!, sample.secret, sample.hmac)).toBe(false);
  });

  it("refuses a wrong secret, a short or non-hex signature", () => {
    expect(verifyHmac(text, "other-secret", sample.hmac)).toBe(false);
    expect(verifyHmac(text, sample.secret, sample.hmac.slice(0, 20))).toBe(false);
    expect(verifyHmac(text, sample.secret, "zz")).toBe(false);
    expect(verifyHmac(text, sample.secret, "")).toBe(false);
  });

  it("concatenates the fields in the documented order and needs all of them", () => {
    expect(PAYMOB_HMAC_FIELDS).toHaveLength(20);
    expect(text.startsWith("15000" + "2026-10-30T12:30:00.123456" + "EGP" + "false")).toBe(true);
    expect(text.endsWith("2346MasterCardcardtrue")).toBe(true);
    expect(signedText({ ...sample.transaction, currency: undefined })).toBeUndefined();
    expect(computeHmac(text, sample.secret)).toBe(sample.hmac);
  });
});
