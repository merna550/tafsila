/** HMAC-SHA512 check of Paymob transaction callbacks. */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Fields of the transaction object, in the order Paymob concatenates them for the HMAC (alphabetical by key).
 * Source: Paymob developer docs, "Transaction Processed Callback" > "HMAC Calculation"
 * (https://developers.paymob.com/egypt/transaction-callbacks-hmac-calculation). Dots mean nested objects.
 * The docs were not reachable from the build session: verify against the dashboard sample when #366 provides keys.
 */
export const PAYMOB_HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

/**
 * Reads a dotted path from a nested object.
 *
 * @param source - The transaction object.
 * @param path - Path such as `order.id`.
 * @returns The value, or undefined when any step is missing.
 */
function readPath(source: unknown, path: string): unknown {
  let current: unknown = source;
  for (const key of path.split(".")) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Concatenates the HMAC fields of a transaction (booleans as `true`/`false`).
 *
 * @param transaction - The transaction object from the callback.
 * @returns The signed text, or undefined when a field is missing.
 */
export function signedText(transaction: unknown): string | undefined {
  let text = "";
  for (const path of PAYMOB_HMAC_FIELDS) {
    const value = readPath(transaction, path);
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean")
      return undefined;
    text += String(value);
  }
  return text;
}

/**
 * Signs a text with HMAC-SHA512.
 *
 * @param text - The concatenated fields.
 * @param secret - The HMAC secret.
 * @returns Lower-case hex digest.
 */
export function computeHmac(text: string, secret: string): string {
  return createHmac("sha512", secret).update(text).digest("hex");
}

/**
 * Compares a received signature with the expected one in constant time.
 *
 * @param text - The concatenated fields.
 * @param secret - The HMAC secret.
 * @param received - The signature that came with the callback.
 * @returns True only when they are equal.
 */
export function verifyHmac(text: string, secret: string, received: string): boolean {
  const expected = Buffer.from(computeHmac(text, secret), "hex");
  const actual = Buffer.from(received.toLowerCase(), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
