/** Payment settings (ADR-368): which gateway runs, the Paymob keys, and the rules for production. */
import { z } from "zod";

/** Payment gateways: `fake` needs no account (CI, e2e, local); `paymob` is the real one (ADR-012, ADR-365). */
export const PAYMENT_GATEWAYS = ["fake", "paymob"] as const;

/** Paymob account modes: `sandbox` is Paymob's test mode, `live` takes real money. */
export const PAYMOB_MODES = ["sandbox", "live"] as const;

/** Shortest signing secret the fake gateway accepts. */
const FAKE_SECRET_MIN_LENGTH = 16;

/** Signing secret of the fake gateway when none is set; public on purpose, the fake gateway is refused in production. */
export const FAKE_PAYMENT_DEFAULT_SECRET = "tafsila-fake-payment-secret-dev-only";

/** Public URL of the app when APP_URL is unset (local development). */
const DEFAULT_APP_URL = "http://localhost:3000";

/** Paymob variables that must all be set when PAYMENT_GATEWAY=paymob. */
export const PAYMOB_REQUIRED_KEYS = [
  "PAYMOB_SECRET_KEY",
  "PAYMOB_PUBLIC_KEY",
  "PAYMOB_HMAC_SECRET",
  "PAYMOB_INTEGRATION_ID_CARD",
  "PAYMOB_INTEGRATION_ID_WALLET",
  "PAYMOB_INTEGRATION_ID_KIOSK",
] as const;

/** Payment variables of the server environment schema. */
export const paymentEnvFields = {
  PAYMENT_GATEWAY: z.enum(PAYMENT_GATEWAYS).default("fake"),
  PAYMOB_MODE: z.enum(PAYMOB_MODES).default("sandbox"),
  PAYMOB_BASE_URL: z.url().default("https://accept.paymob.com"),
  PAYMOB_SECRET_KEY: z.string().min(1).optional(),
  PAYMOB_PUBLIC_KEY: z.string().min(1).optional(),
  PAYMOB_HMAC_SECRET: z.string().min(1).optional(),
  PAYMOB_INTEGRATION_ID_CARD: z.string().min(1).optional(),
  PAYMOB_INTEGRATION_ID_WALLET: z.string().min(1).optional(),
  PAYMOB_INTEGRATION_ID_KIOSK: z.string().min(1).optional(),
  FAKE_PAYMENT_SECRET: z.string().min(FAKE_SECRET_MIN_LENGTH).default(FAKE_PAYMENT_DEFAULT_SECRET),
};

/**
 * Applies the payment rules: the Paymob keys are required when the gateway is `paymob`, and production
 * accepts neither the fake gateway nor Paymob's sandbox (same idea as AI_PROVIDER=fake).
 *
 * @param env - The parsed variables.
 * @param ctx - Zod refinement context.
 */
export function refinePaymentEnv(
  env: { APP_ENV: string; PAYMENT_GATEWAY: string; PAYMOB_MODE: string } & Partial<
    Record<(typeof PAYMOB_REQUIRED_KEYS)[number], string>
  >,
  ctx: z.RefinementCtx,
): void {
  if (env.PAYMENT_GATEWAY === "paymob") {
    for (const key of PAYMOB_REQUIRED_KEYS) {
      if (env[key] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when PAYMENT_GATEWAY=paymob`,
        });
      }
    }
  }
  if (env.APP_ENV !== "production") return;
  if (env.PAYMENT_GATEWAY === "fake") {
    ctx.addIssue({
      code: "custom",
      path: ["PAYMENT_GATEWAY"],
      message: "PAYMENT_GATEWAY=fake is not allowed in production",
    });
  }
  if (env.PAYMOB_MODE !== "live") {
    ctx.addIssue({
      code: "custom",
      path: ["PAYMOB_MODE"],
      message: "PAYMOB_MODE=sandbox is not allowed in production",
    });
  }
}

/** What the payment adapters need; the API passes it in, the adapters never read env. */
export type PaymentConfig =
  | { readonly gateway: "fake"; readonly appUrl: string; readonly secret: string }
  | {
      readonly gateway: "paymob";
      readonly appUrl: string;
      readonly baseUrl: string;
      readonly mode: (typeof PAYMOB_MODES)[number];
      readonly secretKey: string;
      readonly publicKey: string;
      readonly hmacSecret: string;
      readonly integrationIds: { readonly card: string; readonly wallet: string; readonly kiosk: string };
    };

/**
 * Reads the payment settings without validating the rest of the configuration. Switching gateway is an env change only.
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns Fake settings when PAYMENT_GATEWAY is unset; Paymob settings otherwise.
 * @throws {Error} When the gateway name is unknown or Paymob lacks a key (the message names variables, never values).
 * @example
 * loadPaymentConfig({}).gateway; // "fake"
 */
export function loadPaymentConfig(source: Record<string, string | undefined> = process.env): PaymentConfig {
  const gateway = z.enum(PAYMENT_GATEWAYS).safeParse(source.PAYMENT_GATEWAY || "fake");
  if (!gateway.success) throw new Error("Invalid payment configuration: PAYMENT_GATEWAY");
  const appUrl = source.APP_URL || DEFAULT_APP_URL;
  if (gateway.data === "fake") {
    return { gateway: "fake", appUrl, secret: source.FAKE_PAYMENT_SECRET || FAKE_PAYMENT_DEFAULT_SECRET };
  }
  return loadPaymobConfig(source, appUrl);
}

/**
 * Reads the Paymob settings; every key must be present.
 *
 * @param source - Key/value map to read from.
 * @param appUrl - Public URL of this app.
 * @returns The Paymob settings.
 * @throws {Error} Naming the missing or invalid variables, never their values.
 */
function loadPaymobConfig(source: Record<string, string | undefined>, appUrl: string): PaymentConfig {
  const missing = PAYMOB_REQUIRED_KEYS.filter((key) => !source[key]);
  if (missing.length > 0) throw new Error(`Invalid payment configuration: ${missing.join(", ")}`);
  const mode = z.enum(PAYMOB_MODES).safeParse(source.PAYMOB_MODE || "sandbox");
  if (!mode.success) throw new Error("Invalid payment configuration: PAYMOB_MODE");
  return {
    gateway: "paymob",
    appUrl,
    baseUrl: source.PAYMOB_BASE_URL || "https://accept.paymob.com",
    mode: mode.data,
    secretKey: source.PAYMOB_SECRET_KEY!,
    publicKey: source.PAYMOB_PUBLIC_KEY!,
    hmacSecret: source.PAYMOB_HMAC_SECRET!,
    integrationIds: {
      card: source.PAYMOB_INTEGRATION_ID_CARD!,
      wallet: source.PAYMOB_INTEGRATION_ID_WALLET!,
      kiosk: source.PAYMOB_INTEGRATION_ID_KIOSK!,
    },
  };
}
