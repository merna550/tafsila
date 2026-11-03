import { describe, expect, it } from "vitest";
import { creditsResponseSchema, productsResponseSchema } from "./billing";

describe("billing schemas", () => {
  it("accepts a credits response with and without a plan", () => {
    const base = {
      balance: 3,
      grants: [{ credits: 3, expiresAt: null }],
      limits: { maxClients: 10, chatPerDesign: 10 },
    };
    expect(creditsResponseSchema.parse({ ...base, plan: null }).plan).toBeNull();
    const plan = { code: "pro", periodEnd: "2026-11-30T00:00:00.000Z", renewSoon: false };
    expect(
      creditsResponseSchema.parse({ ...base, plan, limits: { maxClients: null, chatPerDesign: 20 } }).plan
        ?.code,
    ).toBe("pro");
  });

  it("rejects a negative balance and a zero-credit grant", () => {
    const limits = { maxClients: null, chatPerDesign: 10 };
    expect(creditsResponseSchema.safeParse({ balance: -1, grants: [], plan: null, limits }).success).toBe(
      false,
    );
    expect(
      creditsResponseSchema.safeParse({
        balance: 0,
        grants: [{ credits: 0, expiresAt: null }],
        plan: null,
        limits,
      }).success,
    ).toBe(false);
  });

  it("accepts a product list", () => {
    const item = {
      code: "single",
      kind: "single",
      pricePiastres: 4900,
      credits: 1,
      creditDays: null,
      periodDays: null,
      maxClients: 10,
      chatPerDesign: 10,
      nameAr: "تصميم واحد",
      nameEn: "Single pattern",
    };
    expect(productsResponseSchema.parse({ items: [item] }).items).toHaveLength(1);
  });
});
