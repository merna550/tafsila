/** Verifies and parses a Paymob-style callback; shared by the Paymob and fake gateways so CI runs the real check. */
import type { CallbackRefusal, PaymentEvent } from "../../ports/payment-gateway";
import { signedText, verifyHmac } from "./hmac";
import { parseTransaction } from "./parse-callback";

/** Receives one log record per callback (ids and outcome only, never the raw payload). */
export type PaymentLogger = (record: Readonly<Record<string, string | number>>) => void;

/**
 * Default logger: one JSON line on stderr (the only console channels the lint rules allow).
 *
 * @param record - What to log (ids and outcome only).
 */
export function consolePaymentLogger(record: Readonly<Record<string, string | number>>): void {
  console.warn(JSON.stringify({ level: "info", ...record }));
}

/**
 * Checks the signature, then parses; logs ids and outcome only.
 *
 * @param transaction - The transaction object of the callback.
 * @param hmac - The signature that came with it.
 * @param secret - The HMAC secret.
 * @param log - Where the one log line goes.
 * @returns The event, or why it was refused.
 */
export function verifyTransaction(
  transaction: unknown,
  hmac: string,
  secret: string,
  log: PaymentLogger,
): PaymentEvent | CallbackRefusal {
  const text = signedText(transaction);
  if (text === undefined) {
    log({ event: "payment_callback", result: "refused", reason: "BAD_PAYLOAD" });
    return { refused: "BAD_PAYLOAD" };
  }
  if (!verifyHmac(text, secret, hmac)) {
    log({ event: "payment_callback", result: "refused", reason: "HMAC_MISMATCH" });
    return { refused: "HMAC_MISMATCH" };
  }
  const event = parseTransaction(transaction);
  if (!event) {
    log({ event: "payment_callback", result: "refused", reason: "BAD_PAYLOAD" });
    return { refused: "BAD_PAYLOAD" };
  }
  log({
    event: "payment_callback",
    result: "accepted",
    gatewayOrderId: event.gatewayOrderId,
    transactionId: event.transactionId,
    outcome: event.outcome,
  });
  return event;
}
