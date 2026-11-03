/** Maps Paymob's transaction object to a PaymentEvent and drops everything else (NFR-04: no card data kept). */
import type { PaymentEvent, PaymentMethod, PaymentOutcome } from "../../ports/payment-gateway";

/** The only fields read from the raw transaction. */
interface RawTransaction {
  readonly id?: unknown;
  readonly amount_cents?: unknown;
  readonly currency?: unknown;
  readonly success?: unknown;
  readonly pending?: unknown;
  readonly is_refunded?: unknown;
  readonly is_voided?: unknown;
  readonly order?: { readonly id?: unknown; readonly merchant_order_id?: unknown };
  readonly source_data?: { readonly type?: unknown };
}

/** Paymob `source_data.type` values and the method each one means. */
const METHOD_BY_SOURCE: Readonly<Record<string, PaymentMethod>> = {
  card: "card",
  wallet: "wallet",
  aggregator: "kiosk",
  cash: "kiosk",
  kiosk: "kiosk",
};

/**
 * Turns the status flags into one outcome (refunded and voided win over success).
 *
 * @param raw - The raw transaction.
 * @returns The outcome.
 */
function outcomeOf(raw: RawTransaction): PaymentOutcome {
  if (raw.is_refunded === true) return "refunded";
  if (raw.is_voided === true) return "failed";
  if (raw.pending === true) return "pending";
  return raw.success === true ? "paid" : "failed";
}

/**
 * Reads an id that Paymob sends as a number or a string.
 *
 * @param value - The raw id.
 * @returns The id as text, or undefined when it is not a usable id.
 */
function idOf(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Reads the payment method from the source type.
 *
 * @param raw - The raw transaction.
 * @returns The method, or undefined for an unknown source.
 */
function methodOf(raw: RawTransaction): PaymentMethod | undefined {
  const type = raw.source_data?.type;
  return typeof type === "string" ? METHOD_BY_SOURCE[type] : undefined;
}

/**
 * Checks the amount and currency: positive whole piastres, EGP only.
 *
 * @param raw - The raw transaction.
 * @returns The amount in piastres, or undefined when invalid.
 */
function piastresOf(raw: RawTransaction): number | undefined {
  const amount = raw.amount_cents;
  if (raw.currency !== "EGP") return undefined;
  return typeof amount === "number" && Number.isInteger(amount) && amount > 0 ? amount : undefined;
}

/**
 * Parses a transaction. Card fields (`source_data.pan` and the rest) are never copied.
 *
 * @param transaction - The transaction object of a callback.
 * @returns The event, or undefined when an id is missing, the currency is not EGP, the amount is not a positive integer or the method is unknown.
 */
export function parseTransaction(transaction: unknown): PaymentEvent | undefined {
  if (typeof transaction !== "object" || transaction === null) return undefined;
  const raw = transaction as RawTransaction;
  const transactionId = idOf(raw.id);
  const gatewayOrderId = idOf(raw.order?.id);
  const paymentId = idOf(raw.order?.merchant_order_id);
  const method = methodOf(raw);
  const amountPiastres = piastresOf(raw);
  if (!transactionId || !gatewayOrderId || !paymentId || !method || amountPiastres === undefined)
    return undefined;
  return {
    gatewayOrderId,
    transactionId,
    amountPiastres,
    currency: "EGP",
    outcome: outcomeOf(raw),
    method,
    paymentId,
  };
}
