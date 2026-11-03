import { describe, expect, it } from "vitest";
import sample from "./__fixtures__/paymob-callback.json";
import { parseTransaction } from "./parse-callback";

const base = sample.transaction;
const withSource = (type: string) => ({ ...base, source_data: { ...base.source_data, type } });

describe("parseTransaction", () => {
  it("parses a paid card payment: amount in piastres, EGP, ids as text", () => {
    expect(parseTransaction(base)).toEqual({
      gatewayOrderId: "900100",
      transactionId: "100200300",
      amountPiastres: 15000,
      currency: "EGP",
      outcome: "paid",
      method: "card",
      paymentId: "11111111-2222-3333-4444-555555555555",
    });
  });

  it("maps the status flags", () => {
    expect(parseTransaction({ ...base, success: false })?.outcome).toBe("failed");
    expect(parseTransaction({ ...base, success: false, pending: true })?.outcome).toBe("pending");
    expect(parseTransaction({ ...base, is_refunded: true })?.outcome).toBe("refunded");
    expect(parseTransaction({ ...base, is_voided: true })?.outcome).toBe("failed");
  });

  it("maps wallet and kiosk sources and refuses an unknown one", () => {
    expect(parseTransaction(withSource("wallet"))?.method).toBe("wallet");
    expect(parseTransaction(withSource("aggregator"))?.method).toBe("kiosk");
    expect(parseTransaction(withSource("bitcoin"))).toBeUndefined();
  });

  it("refuses a currency other than EGP, a missing id or a bad amount", () => {
    expect(parseTransaction({ ...base, currency: "USD" })).toBeUndefined();
    expect(parseTransaction({ ...base, order: { id: 1 } })).toBeUndefined();
    expect(parseTransaction({ ...base, id: undefined })).toBeUndefined();
    expect(parseTransaction({ ...base, amount_cents: 10.5 })).toBeUndefined();
    expect(parseTransaction({ ...base, amount_cents: 0 })).toBeUndefined();
    expect(parseTransaction(null)).toBeUndefined();
  });

  it("never carries card data into the event (NFR-04)", () => {
    const text = JSON.stringify(parseTransaction(base));
    expect(text).not.toMatch(/pan|2346|MasterCard|cvv/i);
    const keys = Object.keys(parseTransaction(base)!).sort((a, b) => a.localeCompare(b));
    expect(keys).toEqual([
      "amountPiastres",
      "currency",
      "gatewayOrderId",
      "method",
      "outcome",
      "paymentId",
      "transactionId",
    ]);
  });
});
