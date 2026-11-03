import { creditsResponseSchema, productsResponseSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B } from "../test-support/memory-app";

describe("GET /api/me/credits", () => {
  it("answers 401 without a token", async () => {
    const app = await createMemoryApp();
    expect((await app.call(undefined, "GET", "/me/credits")).status).toBe(401);
  });

  it("shows 3 credits after verification and never another user's balance", async () => {
    const app = await createMemoryApp();
    await app.call(USER_A, "POST", "/phone/code", { phone: "010 0000 0005" });
    const verified = await app.call(USER_A, "POST", "/phone/verify", {
      phone: "+201000000005",
      code: "123456",
    });
    expect(((await verified.json()) as { trialGranted: boolean }).trialGranted).toBe(true);
    app.billing.grantLot(USER_B, 50, null);
    const res = await app.call(USER_A, "GET", "/me/credits");
    expect(res.status).toBe(200);
    const body = creditsResponseSchema.parse(await res.json());
    expect(body).toEqual({
      balance: 3,
      grants: [{ credits: 3, expiresAt: null }],
      plan: null,
      limits: { maxClients: 10, chatPerDesign: 10 },
    });
  });

  it("has no credits for a user who never verified", async () => {
    const app = await createMemoryApp();
    const body = creditsResponseSchema.parse(await (await app.call(USER_A, "GET", "/me/credits")).json());
    expect(body.balance).toBe(0);
  });
});

describe("GET /api/billing/products", () => {
  it("answers 401 without a token", async () => {
    const app = await createMemoryApp();
    expect((await app.call(undefined, "GET", "/billing/products")).status).toBe(401);
  });

  it("lists only active products", async () => {
    const app = await createMemoryApp();
    const pack = app.billing.products.find((p) => p.code === "pack5");
    if (pack) pack.active = false;
    const res = await app.call(USER_A, "GET", "/billing/products");
    expect(res.status).toBe(200);
    const { items } = productsResponseSchema.parse(await res.json());
    expect(items.map((p) => p.code)).toEqual(["single", "hobby", "pro"]);
  });
});
