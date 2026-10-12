/**
 * PhoneOtp on Supabase Auth phone change: GoTrue generates, stores, expires and checks the code and sends it through
 * the configured SMS provider (decision 26-phone-otp-trial, 1). Tokens returned by verify are discarded.
 */
import { AppError, type ErrorCode } from "../../domain/errors";
import type { PhoneOtp } from "../../ports/phone-otp";

/** What the adapter needs to reach Supabase Auth. */
export interface GotrueConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
  /** Replaceable in tests. */
  readonly fetchImpl?: typeof fetch;
}

/** GoTrue error payload fields we read. */
interface GotrueError {
  readonly error_code?: string;
  readonly code?: string | number;
}

/** HTTP status GoTrue uses for rate limits. */
const HTTP_TOO_MANY_REQUESTS = 429;

/** GoTrue error codes that mean "the code is wrong or gone". */
const CODE_INVALID = new Set(["otp_expired", "invalid_otp", "otp_disabled", "bad_code_verifier"]);

/**
 * Maps a failed GoTrue response to an application error.
 *
 * @param status - HTTP status.
 * @param payload - Parsed body, if any.
 * @param fallback - Code used when nothing matches.
 * @returns The AppError to throw.
 */
function mapGotrueError(status: number, payload: GotrueError | null, fallback: ErrorCode): AppError {
  const gotrueCode = payload?.error_code ?? (typeof payload?.code === "string" ? payload.code : "");
  if (gotrueCode === "phone_exists") return new AppError("PHONE_ALREADY_USED");
  if (
    gotrueCode === "over_sms_send_rate_limit" ||
    gotrueCode === "over_request_rate_limit" ||
    status === HTTP_TOO_MANY_REQUESTS
  ) {
    return new AppError("PHONE_TOO_MANY_ATTEMPTS");
  }
  if (CODE_INVALID.has(gotrueCode)) return new AppError("PHONE_CODE_INVALID");
  return new AppError(fallback);
}

/**
 * Reads a JSON body without throwing.
 *
 * @param response - Fetch response.
 * @returns The parsed object or null.
 */
async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Creates the GoTrue-backed PhoneOtp.
 *
 * @param config - Project URL, anon key and optional fetch.
 * @returns A PhoneOtp.
 */
export function createGotruePhoneOtp(config: GotrueConfig): PhoneOtp {
  const doFetch = config.fetchImpl ?? fetch;
  const base = `${config.supabaseUrl.replace(/\/$/, "")}/auth/v1`;

  /**
   * Calls GoTrue and maps transport failures to PHONE_SEND_FAILED.
   *
   * @param path - Path under /auth/v1.
   * @param init - Method, headers and body.
   * @returns The response.
   */
  const call = async (path: string, init: RequestInit): Promise<Response> => {
    try {
      return await doFetch(`${base}${path}`, init);
    } catch {
      throw new AppError("PHONE_SEND_FAILED");
    }
  };

  return {
    async send(caller, e164) {
      const response = await call("/user", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          apikey: config.anonKey,
          authorization: `Bearer ${caller.accessToken}`,
        },
        body: JSON.stringify({ phone: e164 }),
      });
      if (!response.ok) throw mapGotrueError(response.status, await readJson(response), "PHONE_SEND_FAILED");
    },
    async verify(e164, code) {
      const response = await call("/verify", {
        method: "POST",
        headers: { "content-type": "application/json", apikey: config.anonKey },
        body: JSON.stringify({ type: "phone_change", phone: e164, token: code }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        const e = mapGotrueError(response.status, payload, "PHONE_CODE_INVALID");
        throw new AppError(e.code, { messageEn: `DIAG gotrue ${response.status} ${JSON.stringify(payload)}` });
      }
      const userId = (payload?.user as { id?: unknown } | undefined)?.id;
      if (typeof userId !== "string") throw new AppError("PHONE_CODE_INVALID", { messageEn: `DIAG no user ${JSON.stringify(payload).slice(0, 300)}` });
      return { userId };
    },
  };
}
