/** Port to the payment provider (ADR-012): routes and services see this, never Paymob (FR-BILL-04). */

/** How the buyer pays: online card, mobile wallet, or cash at a kiosk. */
export type PaymentMethod = "card" | "wallet" | "kiosk";

/** What the buyer's payment is for and who pays; amounts are integer piastres, currency is always EGP. */
export interface CreateIntentionInput {
  /** Our own payment row id; comes back in the callback so the callback can be matched. */
  readonly paymentId: string;
  /** Total in piastres (1 EGP = 100 piastres). */
  readonly amountPiastres: number;
  /** Stable product code from the `products` table. */
  readonly productCode: string;
  /** Product name shown on the checkout page. */
  readonly productName: string;
  /** Chosen payment method. */
  readonly method: PaymentMethod;
  /** The buyer's contact data (never card data). */
  readonly customer: { readonly firstName: string; readonly phone: string; readonly email?: string };
}

/** What the gateway returns for a new payment: where to send the buyer, or the cash reference to pay. */
export interface Intention {
  /** The gateway's id of this payment order; stored on the payment row. */
  readonly gatewayOrderId: string;
  /** Hosted checkout page for card and wallet. */
  readonly checkoutUrl?: string;
  /** Reference the buyer pays at a cash kiosk. */
  readonly kioskReference?: string;
}

/** Final or interim state of a payment as the gateway reports it. */
export type PaymentOutcome = "paid" | "failed" | "pending" | "refunded";

/** A verified, parsed callback. It holds ids, amount and outcome only; no card data ever enters it. */
export interface PaymentEvent {
  /** Gateway order id (matches `Intention.gatewayOrderId`). */
  readonly gatewayOrderId: string;
  /** Gateway transaction id (unique per attempt; the idempotency key of fulfilment). */
  readonly transactionId: string;
  /** Amount in piastres. */
  readonly amountPiastres: number;
  /** Currency; anything but EGP is refused. */
  readonly currency: "EGP";
  /** What happened to the payment. */
  readonly outcome: PaymentOutcome;
  /** How it was paid. */
  readonly method: PaymentMethod;
  /** Our payment row id that was sent with the intention. */
  readonly paymentId: string;
}

/** Why a callback was not accepted. */
export interface CallbackRefusal {
  /** `HMAC_MISMATCH`: not signed by the gateway; `BAD_PAYLOAD`: signed or not, the content is unusable. */
  readonly refused: "HMAC_MISMATCH" | "BAD_PAYLOAD";
}

/** The payment provider as the application needs it. */
export interface PaymentGateway {
  /**
   * Starts a payment.
   *
   * @param input - Amount, product, method and buyer.
   * @returns Where the buyer pays.
   * @throws {AppError} `PAYMENT_GATEWAY_UNAVAILABLE` when the provider cannot be reached or refuses.
   */
  createIntention(input: CreateIntentionInput): Promise<Intention>;

  /**
   * Checks the signature of a callback and parses it.
   *
   * @param transaction - The transaction object from the callback body (`obj`).
   * @param hmac - The signature sent with the callback (hex).
   * @returns The parsed event, or a refusal.
   */
  verifyCallback(transaction: unknown, hmac: string): PaymentEvent | CallbackRefusal;
}
