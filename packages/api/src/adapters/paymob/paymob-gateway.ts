/** Paymob adapter: intention API + unified checkout (ADR-368). Secrets stay server-side; fetch is injected so tests need no network. */
import type { PaymentConfig } from "@tafsila/config";
import { AppError } from "../../domain/errors";
import type { CreateIntentionInput, Intention, PaymentGateway } from "../../ports/payment-gateway";
import { consolePaymentLogger, verifyTransaction, type PaymentLogger } from "./transaction-verifier";

/** Settings of the Paymob variant of PaymentConfig. */
export type PaymobConfig = Extract<PaymentConfig, { gateway: "paymob" }>;

/** Longest a Paymob call may take. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Paymob requires a last name and an email; these stand in when the buyer gave none. */
const FALLBACK_LAST_NAME = "NA";
const FALLBACK_EMAIL = "noreply@tafsila.invalid";

/** Parts of Paymob's intention response that are used. */
interface IntentionResponse {
  readonly client_secret?: unknown;
  readonly id?: unknown;
  readonly intention_order_id?: unknown;
}

/**
 * Builds the intention request body.
 *
 * @param config - Paymob settings.
 * @param input - The payment to start.
 * @returns The JSON body (amount in piastres, EGP, one payment method).
 */
function intentionBody(config: PaymobConfig, input: CreateIntentionInput): Record<string, unknown> {
  return {
    amount: input.amountPiastres,
    currency: "EGP",
    payment_methods: [Number(config.integrationIds[input.method])],
    items: [
      { name: input.productName, amount: input.amountPiastres, description: input.productCode, quantity: 1 },
    ],
    billing_data: {
      first_name: input.customer.firstName,
      last_name: FALLBACK_LAST_NAME,
      phone_number: input.customer.phone,
      email: input.customer.email ?? FALLBACK_EMAIL,
    },
    special_reference: input.paymentId,
    notification_url: `${config.appUrl}/api/payments/callback`,
    redirection_url: `${config.appUrl}/payments/return`,
  };
}

/**
 * Creates the Paymob gateway.
 *
 * @param config - Paymob settings from `loadPaymentConfig`.
 * @param fetchImpl - The fetch function (defaults to the global one; tests pass a stub).
 * @param log - Where callback log lines go.
 * @returns A PaymentGateway.
 */
export function createPaymobGateway(
  config: PaymobConfig,
  fetchImpl: typeof fetch = fetch,
  log: PaymentLogger = consolePaymentLogger,
): PaymentGateway {
  return {
    async createIntention(input): Promise<Intention> {
      let body: IntentionResponse;
      try {
        const response = await fetchImpl(`${config.baseUrl}/v1/intention/`, {
          method: "POST",
          headers: { Authorization: `Token ${config.secretKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(intentionBody(config, input)),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        body = (await response.json()) as IntentionResponse;
      } catch (error) {
        // Only the failure kind is kept: the request holds the secret key and buyer data.
        const kind =
          error instanceof Error && /^status \d+$/.test(error.message) ? error.message : "unreachable";
        throw new AppError("PAYMENT_GATEWAY_UNAVAILABLE", { messageEn: `Paymob request failed (${kind})` });
      }
      const clientSecret = typeof body.client_secret === "string" ? body.client_secret : undefined;
      const orderId = body.intention_order_id ?? body.id;
      if (!clientSecret || (typeof orderId !== "number" && typeof orderId !== "string")) {
        throw new AppError("PAYMENT_GATEWAY_UNAVAILABLE", {
          messageEn: "Paymob answered without a client secret",
        });
      }
      const query = new URLSearchParams({ publicKey: config.publicKey, clientSecret });
      return { gatewayOrderId: String(orderId), checkoutUrl: `${config.baseUrl}/unifiedcheckout/?${query}` };
    },
    verifyCallback: (transaction, hmac) => verifyTransaction(transaction, hmac, config.hmacSecret, log),
  };
}
