/** Use case: the products on sale (FR-BILL-03). */
import type { ProductsResponse } from "@tafsila/schemas";
import type { BillingRepository } from "../ports/billing-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists the active products, cheapest first.
 *
 * @param billing - Billing repository.
 * @param ctx - Verified caller.
 * @returns The products.
 */
export async function listProducts(billing: BillingRepository, ctx: AuthContext): Promise<ProductsResponse> {
  return { items: await billing.listProducts(ctx) };
}
