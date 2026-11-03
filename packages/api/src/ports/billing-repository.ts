/** Billing repository port: the credit read model, the trial grant and the products on sale (issue #370). */
import type { Product } from "@tafsila/schemas";
import type { CreditLot } from "../domain/billing";
import type { AuthContext } from "./token-verifier";

/** The active plan of a user. */
export interface ActivePlan {
  readonly code: string;
  /** ISO time the current period ends. */
  readonly periodEnd: string;
  /** Null = unlimited. */
  readonly maxClients: number | null;
  readonly chatPerDesign: number;
}

/** Everything the credits screen needs, read in one go. */
export interface CreditSummary {
  readonly balance: number;
  /** Unexpired lots with credits left. */
  readonly lots: readonly CreditLot[];
  /** Null when she has no active plan (none, or the period is over). */
  readonly plan: ActivePlan | null;
}

/** Reads credits and plans and grants the trial; adapters call the `private` SQL functions through `withApiRole`. */
export interface BillingRepository {
  /** Balance, lots and the active plan of a user. */
  summary(userId: string): Promise<CreditSummary>;
  /** Grants the free trial once; true only when credits were granted by this call. */
  grantTrial(userId: string, credits: number): Promise<boolean>;
  /** Active products ordered by price (readable by every signed-in user). */
  listProducts(ctx: AuthContext): Promise<Product[]>;
}
