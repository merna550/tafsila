/** In-memory billing: a credit ledger with the same expiry rules as the SQL functions, plans and products, for service and route tests. */
import { productSchema, type Product } from "@tafsila/schemas";
import { defaultPlanLimits } from "../../domain/plan-limits";
import type { ActivePlan, BillingRepository } from "../../ports/billing-repository";
import type { Clock } from "../../ports/clock";
import type { PlanLimits } from "../../ports/plan-limits";
import type { MemoryPhoneVerification } from "./phone-verification-repository";

/** A product row plus the `active` flag the real table has. */
export interface MemoryProduct extends Product {
  active: boolean;
}

/** The four products of the billing migration (prices in piastres). */
export const MEMORY_PRODUCTS: readonly MemoryProduct[] = [
  {
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
    active: true,
  },
  {
    code: "pack5",
    kind: "pack",
    pricePiastres: 19900,
    credits: 5,
    creditDays: 90,
    periodDays: null,
    maxClients: 10,
    chatPerDesign: 10,
    nameAr: "باقة ٥ تصميمات",
    nameEn: "5-pack",
    active: true,
  },
  {
    code: "hobby",
    kind: "subscription",
    pricePiastres: 14900,
    credits: 8,
    creditDays: null,
    periodDays: 30,
    maxClients: 10,
    chatPerDesign: 10,
    nameAr: "هواية شهرياً",
    nameEn: "Hobby monthly",
    active: true,
  },
  {
    code: "pro",
    kind: "subscription",
    pricePiastres: 34900,
    credits: 30,
    creditDays: null,
    periodDays: 30,
    maxClients: null,
    chatPerDesign: 20,
    nameAr: "محترف شهرياً",
    nameEn: "Pro monthly",
    active: true,
  },
];

/** An active plan in the fake table. */
export interface MemoryPlan {
  readonly code: string;
  readonly periodEnd: Date;
  readonly maxClients: number | null;
  readonly chatPerDesign: number;
}

/** Billing repository and plan limits plus the hooks tests use to add credits, plans and products. */
export interface MemoryBilling extends BillingRepository, PlanLimits {
  /** Adds a lot of credits (null expiry = never expires). */
  grantLot(userId: string, credits: number, expiresAt: Date | null): void;
  /** Sets (or with null removes) the user's active plan. */
  setPlan(userId: string, plan: MemoryPlan | null): void;
  /** The product rows; tests may push an inactive one. */
  readonly products: MemoryProduct[];
}

/** Options of the memory billing. */
export interface MemoryBillingOptions {
  readonly clock: Clock;
  /** Gives the trial rule (verified, not granted yet) and receives the trial credits at verification. */
  readonly phones: MemoryPhoneVerification;
  /** Chat messages per design without a plan. */
  readonly chatPerDesign: number;
  /** Credits every user has on top of her lots (tests that save versions need some; default 0). */
  readonly startingCredits?: number;
}

/** A lot in the fake ledger. */
interface Lot {
  readonly userId: string;
  readonly remaining: number;
  readonly expiresAt: Date | null;
}

/**
 * Drops the `active` flag, which the API never shows.
 *
 * @param row - A product row.
 * @returns The public product.
 */
function toProduct(row: MemoryProduct): Product {
  return productSchema.parse(row);
}

/**
 * Creates the memory billing and subscribes it to the trial grants of the memory phone verification.
 *
 * @param options - Clock, phone store, default chat limit and starting credits.
 * @returns A MemoryBilling.
 */
export function createMemoryBilling(options: MemoryBillingOptions): MemoryBilling {
  const { clock, phones, chatPerDesign, startingCredits = 0 } = options;
  const lots: Lot[] = [];
  const plans = new Map<string, MemoryPlan>();
  const products: MemoryProduct[] = MEMORY_PRODUCTS.map((p) => ({ ...p }));
  /**
   * Adds a lot to the fake ledger.
   *
   * @param userId - Owner.
   * @param credits - Credits in the lot.
   * @param expiresAt - Expiry, or null for never.
   */
  const grantLot = (userId: string, credits: number, expiresAt: Date | null): void => {
    lots.push({ userId, remaining: credits, expiresAt });
  };
  phones.onTrialGranted((userId, credits) => grantLot(userId, credits, null));

  /**
   * The user's plan when its period is not over (same rule as the SQL functions).
   *
   * @param userId - Account.
   * @returns The plan or undefined.
   */
  const activePlan = (userId: string): MemoryPlan | undefined => {
    const plan = plans.get(userId);
    return plan && plan.periodEnd > clock.now() ? plan : undefined;
  };

  return {
    products,
    grantLot,
    setPlan(userId, plan) {
      if (plan) plans.set(userId, plan);
      else plans.delete(userId);
    },
    summary(userId) {
      const now = clock.now();
      const own = lots
        .filter((l) => l.userId === userId && l.remaining > 0 && (!l.expiresAt || l.expiresAt > now))
        .map((l) => ({ remaining: l.remaining, expiresAt: l.expiresAt?.toISOString() ?? null }));
      const all = startingCredits > 0 ? [...own, { remaining: startingCredits, expiresAt: null }] : own;
      const plan = activePlan(userId);
      const active: ActivePlan | null = plan ? { ...plan, periodEnd: plan.periodEnd.toISOString() } : null;
      return Promise.resolve({
        balance: all.reduce((sum, l) => sum + l.remaining, 0),
        lots: all,
        plan: active,
      });
    },
    async grantTrial(userId, credits) {
      if (!(await phones.isEligible(userId))) return false;
      phones.grantTrial(userId);
      grantLot(userId, credits, null);
      return true;
    },
    listProducts: () =>
      Promise.resolve(
        products
          .filter((p) => p.active)
          .sort((a, b) => a.pricePiastres - b.pricePiastres)
          .map((p) => toProduct(p)),
      ),
    limits: (ctx) => {
      const plan = activePlan(ctx.userId);
      return Promise.resolve(
        plan
          ? { maxClients: plan.maxClients, chatPerDesign: plan.chatPerDesign }
          : defaultPlanLimits(chatPerDesign),
      );
    },
  };
}
