import { describe, expect, it, vi } from "vitest";
import { createPaymentGateway } from "./container";

const input = {
  paymentId: "p",
  amountPiastres: 100,
  productCode: "c",
  productName: "n",
  method: "card" as const,
  customer: { firstName: "M", phone: "+201000000001" },
};

describe("createPaymentGateway", () => {
  it("uses the fake gateway by default", async () => {
    const intention = await createPaymentGateway({}).createIntention(input);
    expect(intention.checkoutUrl).toContain("/dev/fake-checkout");
  });

  it("uses Paymob when configured", () => {
    const gateway = createPaymentGateway({
      PAYMENT_GATEWAY: "paymob",
      PAYMOB_SECRET_KEY: "s",
      PAYMOB_PUBLIC_KEY: "p",
      PAYMOB_HMAC_SECRET: "h",
      PAYMOB_INTEGRATION_ID_CARD: "1",
      PAYMOB_INTEGRATION_ID_WALLET: "2",
      PAYMOB_INTEGRATION_ID_KIOSK: "3",
    });
    expect(gateway.verifyCallback(null, "00")).toEqual({ refused: "BAD_PAYLOAD" });
  });

  it("fails only the payment calls when the configuration is bad", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const gateway = createPaymentGateway({ PAYMENT_GATEWAY: "paymob", PAYMOB_SECRET_KEY: "s" });
    await expect(gateway.createIntention(input)).rejects.toMatchObject({
      code: "PAYMENT_GATEWAY_UNAVAILABLE",
    });
    expect(() => gateway.verifyCallback({}, "00")).toThrow();
  });
});
