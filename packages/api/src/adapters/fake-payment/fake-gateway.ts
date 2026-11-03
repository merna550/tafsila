/** Fake payment gateway for CI, e2e and local work (no account, no network). It signs its own callbacks with the same HMAC code as Paymob. */
import type { PaymentConfig } from "@tafsila/config";
import { computeHmac, signedText } from "../paymob/hmac";
import { consolePaymentLogger, verifyTransaction, type PaymentLogger } from "../paymob/transaction-verifier";
import type { PaymentEvent, PaymentGateway } from "../../ports/payment-gateway";

/** Settings of the fake variant of PaymentConfig. */
export type FakePaymentConfig = Extract<PaymentConfig, { gateway: "fake" }>;

/** A test callback: the transaction object and its signature, as the callback route would receive them. */
export interface SignedCallback {
  /** Paymob-shaped transaction object. */
  readonly transaction: Record<string, unknown>;
  /** HMAC-SHA512 hex of its fields. */
  readonly hmac: string;
}

/** The fake gateway plus the helper tests and the fake checkout page use to simulate the provider's callback. */
export interface FakePaymentGateway extends PaymentGateway {
  /**
   * Builds a callback the way Paymob would send it, signed with the fake secret.
   *
   * @param event - What the callback should report.
   * @returns The transaction object and its HMAC.
   */
  signTestCallback(event: PaymentEvent): SignedCallback;
}

/** Source type Paymob uses for each method. */
const SOURCE_TYPE = { card: "card", wallet: "wallet", kiosk: "aggregator" } as const;

/**
 * Creates the fake gateway.
 *
 * @param config - Fake settings from `loadPaymentConfig`.
 * @param log - Where callback log lines go.
 * @returns A FakePaymentGateway.
 */
export function createFakePaymentGateway(
  config: FakePaymentConfig,
  log: PaymentLogger = consolePaymentLogger,
): FakePaymentGateway {
  return {
    createIntention(input) {
      const gatewayOrderId = `fake-order-${input.paymentId}`;
      if (input.method === "kiosk") {
        return Promise.resolve({ gatewayOrderId, kioskReference: `FAKE${input.amountPiastres}` });
      }
      const query = new URLSearchParams({ payment: input.paymentId, order: gatewayOrderId });
      return Promise.resolve({
        gatewayOrderId,
        checkoutUrl: `${config.appUrl}/ar/dev/fake-checkout?${query}`,
      });
    },
    verifyCallback: (transaction, hmac) => verifyTransaction(transaction, hmac, config.secret, log),
    signTestCallback(event) {
      const transaction = {
        id: event.transactionId,
        amount_cents: event.amountPiastres,
        created_at: "2026-01-01T00:00:00.000000",
        currency: event.currency,
        error_occured: false,
        has_parent_transaction: false,
        integration_id: 1,
        is_3d_secure: false,
        is_auth: false,
        is_capture: false,
        is_refunded: event.outcome === "refunded",
        is_standalone_payment: true,
        is_voided: false,
        owner: 1,
        pending: event.outcome === "pending",
        success: event.outcome === "paid" || event.outcome === "refunded",
        order: { id: event.gatewayOrderId, merchant_order_id: event.paymentId },
        source_data: { pan: "NA", sub_type: "NA", type: SOURCE_TYPE[event.method] },
      };
      return { transaction, hmac: computeHmac(signedText(transaction) ?? "", config.secret) };
    },
  };
}
