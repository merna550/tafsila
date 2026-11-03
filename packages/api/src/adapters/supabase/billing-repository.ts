/** Drizzle billing repository: balance and trial go through the `private` functions (withApiRole); products are read as the user (RLS). */
import { asc, eq, sql } from "drizzle-orm";
import type { Product } from "@tafsila/schemas";
import type { ActivePlan, BillingRepository, CreditSummary } from "../../ports/billing-repository";
import { scalar } from "./scalar";
import { products } from "./schema";
import type { WithApiRole, WithUser } from "./with-user";

/** The JSON that `private.credit_summary` returns. */
interface SummaryJson {
  balance: number;
  lots: { remaining: number; expires_at: string | null }[];
  plan: { code: string; period_end: string; max_clients: number | null; chat_per_design: number } | null;
}

/**
 * Converts a database timestamp to ISO text.
 *
 * @param value - A timestamptz as text.
 * @returns ISO 8601 text.
 */
const iso = (value: string): string => new Date(value).toISOString();

/**
 * Maps the summary JSON to the port type.
 *
 * @param json - Result of `private.credit_summary`.
 * @returns The credit summary.
 */
function toSummary(json: SummaryJson): CreditSummary {
  const plan: ActivePlan | null = json.plan && {
    code: json.plan.code,
    periodEnd: iso(json.plan.period_end),
    maxClients: json.plan.max_clients,
    chatPerDesign: json.plan.chat_per_design,
  };
  return {
    balance: json.balance,
    lots: json.lots.map((l) => ({ remaining: l.remaining, expiresAt: l.expires_at && iso(l.expires_at) })),
    plan,
  };
}

/**
 * Creates the billing repository.
 *
 * @param withApiRole - Door to the private functions.
 * @param withUser - Door that applies the user's RLS (products).
 * @returns A BillingRepository.
 */
export function createBillingRepository(withApiRole: WithApiRole, withUser: WithUser): BillingRepository {
  return {
    summary: (userId) =>
      withApiRole(async (tx) =>
        toSummary(
          await scalar<SummaryJson>(tx, sql`select private.credit_summary(${userId}::uuid) as result`),
        ),
      ),
    grantTrial: (userId, credits) =>
      withApiRole((tx) =>
        scalar<boolean>(tx, sql`select private.grant_trial(${userId}::uuid, ${credits}::integer) as result`),
      ),
    listProducts: (ctx) =>
      withUser(ctx, (tx): Promise<Product[]> =>
        tx
          .select({
            code: products.code,
            kind: products.kind,
            pricePiastres: products.pricePiastres,
            credits: products.credits,
            creditDays: products.creditDays,
            periodDays: products.periodDays,
            maxClients: products.maxClients,
            chatPerDesign: products.chatPerDesign,
            nameAr: products.nameAr,
            nameEn: products.nameEn,
          })
          .from(products)
          .where(eq(products.active, true))
          .orderBy(asc(products.pricePiastres), asc(products.code)),
      ),
  };
}
