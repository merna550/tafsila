import { describe, expect, it, vi } from "vitest";
import { createFakePaymentGateway } from "./fake-gateway";

const config = {
  gateway: "fake" as const,
  appUrl: "http://localhost:3000",
  secret: "fake-secret-0123456789",
};
const input = {
  paymentId: "pay-9",
  amountPiastres: 9900,
  productCode: "pack_5",
  productName: "Pack",
  method: "card" as const,
  customer: { firstName: "Mona", phone: "+201000000001" },
};

describe("fake payment gateway", () => {
  it("returns a local checkout page URL, or a reference for kiosk", async () => {
    const gateway = createFakePaymentGateway(config, vi.fn());
    const card = await gateway.createIntention(input);
    expect(card.checkoutUrl).toBe(
      "http://localhost:3000/ar/dev/fake-checkout?payment=pay-9&order=fake-order-pay-9",
    );
    const kiosk = await gateway.createIntention({ ...input, method: "kiosk" });
    expect(kiosk.kioskReference).toBeTruthy();
    expect(kiosk.checkoutUrl).toBeUndefined();
  });

  it("round trip: a signed test callback verifies to the same event", () => {
    const gateway = createFakePaymentGateway(config, vi.fn());
    for (const method of ["card", "wallet", "kiosk"] as const) {
      for (const outcome of ["paid", "failed", "pending", "refunded"] as const) {
        const event = {
          gatewayOrderId: "fake-order-pay-9",
          transactionId: "tx-1",
          amountPiastres: 9900,
          currency: "EGP" as const,
          outcome,
          method,
          paymentId: "pay-9",
        };
        const { transaction, hmac } = gateway.signTestCallback(event);
        expect(gateway.verifyCallback(transaction, hmac)).toEqual(event);
      }
    }
  });

  it("refuses a tampered callback and one signed with another secret (the real check runs)", () => {
    const gateway = createFakePaymentGateway(config, vi.fn());
    const other = createFakePaymentGateway({ ...config, secret: "another-secret-0123456" }, vi.fn());
    const event = {
      gatewayOrderId: "o",
      transactionId: "t",
      amountPiastres: 100,
      currency: "EGP" as const,
      outcome: "paid" as const,
      method: "card" as const,
      paymentId: "p",
    };
    const { transaction, hmac } = gateway.signTestCallback(event);
    expect(gateway.verifyCallback({ ...transaction, amount_cents: 1 }, hmac)).toEqual({
      refused: "HMAC_MISMATCH",
    });
    expect(other.verifyCallback(transaction, hmac)).toEqual({ refused: "HMAC_MISMATCH" });
  });
});
