/** Contracts of /api/me/credits and /api/billing/products (FR-BILL-02, FR-BILL-03): the balance, the plan and what can be bought. */
import { z } from "zod";

/** One group of credits that expire together; `expiresAt` null means they never expire. */
export const creditGrantSchema = z.object({
  credits: z.number().int().positive().meta({ example: 3 }),
  expiresAt: z.iso.datetime().nullable().meta({ example: null }),
});

/** The active plan of the caller. `renewSoon` is true when the period ends within 7 days. */
export const creditsPlanSchema = z.object({
  code: z.string().meta({ example: "hobby" }),
  periodEnd: z.iso.datetime().meta({ example: "2026-11-30T00:00:00.000Z" }),
  renewSoon: z.boolean(),
});

/** What the caller's plan allows; `maxClients` null means unlimited. */
export const planLimitsSchema = z.object({
  maxClients: z.number().int().positive().nullable().meta({ example: 10 }),
  chatPerDesign: z.number().int().positive().meta({ example: 10 }),
});

/** Response of GET /api/me/credits. */
export const creditsResponseSchema = z.object({
  balance: z.number().int().nonnegative().meta({ example: 3 }),
  grants: z.array(creditGrantSchema),
  plan: creditsPlanSchema.nullable(),
  limits: planLimitsSchema,
});

/** Parsed credits response. */
export type CreditsResponse = z.infer<typeof creditsResponseSchema>;

/** One product on sale; prices are in piastres (4900 = 49 EGP). */
export const productSchema = z.object({
  code: z.string().meta({ example: "pack5" }),
  kind: z.enum(["single", "pack", "subscription"]),
  pricePiastres: z.number().int().positive().meta({ example: 19900 }),
  credits: z.number().int().positive().meta({ example: 5 }),
  creditDays: z.number().int().positive().nullable().meta({ example: 90 }),
  periodDays: z.number().int().positive().nullable().meta({ example: null }),
  maxClients: z.number().int().positive().nullable().meta({ example: 10 }),
  chatPerDesign: z.number().int().positive().meta({ example: 10 }),
  nameAr: z.string().meta({ example: "باقة ٥ تصميمات" }),
  nameEn: z.string().meta({ example: "5-pack" }),
});

/** Parsed product. */
export type Product = z.infer<typeof productSchema>;

/** Response of GET /api/billing/products. */
export const productsResponseSchema = z.object({ items: z.array(productSchema) });

/** Parsed products response. */
export type ProductsResponse = z.infer<typeof productsResponseSchema>;
