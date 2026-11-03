import { describe, expect, it, vi } from "vitest";
import sample from "./__fixtures__/paymob-callback.json";
import { createPaymobGateway, type PaymobConfig } from "./paymob-gateway";

const config: PaymobConfig = {
  gateway: "paymob",
  appUrl: "https://staging.example.test",
  baseUrl: "https://accept.example.test",
  mode: "sandbox",
  secretKey: "egy_sk_test_SECRET",
  publicKey: "egy_pk_test_PUBLIC",
  hmacSecret: sample.secret,
  integrationIds: { card: "4001", wallet: "4002", kiosk: "4003" },
};
const input = {
  paymentId: "pay-1",
  amountPiastres: 15000,
  productCode: "pattern_single",
  productName: "Single pattern",
  method: "wallet" as const,
  customer: { firstName: "Mona", phone: "+201000000001" },
};
/** Request body of a stub call, typed for the assertions. */
interface SentBody {
  readonly items: readonly { readonly amount: number }[];
  readonly payment_methods: readonly number[];
}
const sentBody = (call: unknown[]): SentBody =>
  JSON.parse((call[1] as RequestInit).body as string) as SentBody;
const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe("createPaymobGateway.createIntention", () => {
  it("posts piastres, EGP and the integration of the method with the secret key", async () => {
    const stub = vi.fn().mockReturnValue(ok({ client_secret: "cs_123", intention_order_id: 900100 }));
    const result = await createPaymobGateway(config, stub).createIntention(input);
    const [url, init] = stub.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as SentBody;
    expect(url).toBe("https://accept.example.test/v1/intention/");
    expect((init.headers as Record<string, string>).Authorization).toBe("Token egy_sk_test_SECRET");
    expect(body).toMatchObject({
      amount: 15000,
      currency: "EGP",
      payment_methods: [4002],
      special_reference: "pay-1",
      notification_url: "https://staging.example.test/api/payments/callback",
    });
    expect(body.items[0]!.amount).toBe(15000);
    expect(result).toEqual({
      gatewayOrderId: "900100",
      checkoutUrl:
        "https://accept.example.test/unifiedcheckout/?publicKey=egy_pk_test_PUBLIC&clientSecret=cs_123",
    });
  });

  it("uses the card and kiosk integrations for those methods", async () => {
    const stub = vi.fn().mockImplementation(() => ok({ client_secret: "c", id: "x" }));
    const gateway = createPaymobGateway(config, stub);
    await gateway.createIntention({ ...input, method: "card" });
    await gateway.createIntention({ ...input, method: "kiosk" });
    const ids = (stub.mock.calls as unknown[][]).map((call) => sentBody(call).payment_methods);
    expect(ids).toEqual([[4001], [4003]]);
  });

  it("maps a non-2xx answer, a network error and a bad body to PAYMENT_GATEWAY_UNAVAILABLE without leaking the secret", async () => {
    const failures = [
      vi.fn().mockResolvedValue(new Response("nope", { status: 401 })),
      vi.fn().mockRejectedValue(new Error("connect failed with Token egy_sk_test_SECRET")),
      vi.fn().mockReturnValue(ok({ id: 1 })),
    ];
    for (const stub of failures) {
      const error = (await createPaymobGateway(config, stub)
        .createIntention(input)
        .catch((e: unknown) => e)) as Error & { code: string };
      expect(error.code).toBe("PAYMENT_GATEWAY_UNAVAILABLE");
      expect(JSON.stringify([error.message, String(error.stack)])).not.toContain("egy_sk_test_SECRET");
    }
  });
});

describe("createPaymobGateway.verifyCallback", () => {
  it("accepts the sample and logs ids and outcome only", () => {
    const log = vi.fn();
    const result = createPaymobGateway(config, vi.fn(), log).verifyCallback(sample.transaction, sample.hmac);
    expect(result).toMatchObject({ outcome: "paid", amountPiastres: 15000 });
    expect(log).toHaveBeenCalledTimes(1);
    const line = JSON.stringify(log.mock.calls[0]![0]);
    expect(line).toContain("100200300");
    expect(line).not.toMatch(/2346|MasterCard|pan|amount|phone|egy_/i);
  });

  it("refuses a bad signature, a missing field and a USD payment", () => {
    const gateway = createPaymobGateway(config, vi.fn(), vi.fn());
    expect(gateway.verifyCallback(sample.transaction, "00")).toEqual({ refused: "HMAC_MISMATCH" });
    expect(gateway.verifyCallback({ id: 1 }, sample.hmac)).toEqual({ refused: "BAD_PAYLOAD" });
    expect(gateway.verifyCallback(null, sample.hmac)).toEqual({ refused: "BAD_PAYLOAD" });
  });
});
