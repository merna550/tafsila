/** Token verifier adapter: checks Supabase access tokens with jose against the project's JWKS (ADR-035, plan #25). */
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import {
  TokenVerifierConfigError,
  type AuthContext,
  type TokenVerifier,
  type UserRole,
} from "../../ports/token-verifier";

/** Audience Supabase puts in access tokens of signed-in users. */
const AUDIENCE = "authenticated";

/**
 * Reads the role claim; anything other than `admin` is a plain user, so a missing or odd claim never grants more.
 *
 * @param value - The raw `user_role` claim.
 * @returns The role.
 */
function toRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}

/** Options for the verifier. */
export interface JwksTokenVerifierOptions {
  /** Supabase project URL; the issuer is `<url>/auth/v1`. */
  readonly supabaseUrl: string;
  /** Key source; defaults to the project's remote JWKS. Tests pass a local key set. */
  readonly keys?: JWTVerifyGetKey;
}

/**
 * Creates a verifier that checks signature, issuer, audience and expiry.
 *
 * @param options - Project URL and optional key source.
 * @returns A TokenVerifier.
 */
export function createJwksTokenVerifier(options: JwksTokenVerifierOptions): TokenVerifier {
  const issuer = `${options.supabaseUrl.replace(/\/$/, "")}/auth/v1`;
  let remoteKeys: JWTVerifyGetKey | undefined;
  /**
   * Builds the remote key set on first use, so a bad SUPABASE_URL fails the request, never the build.
   *
   * @returns The key source.
   */
  const getKeys = (): JWTVerifyGetKey => {
    if (options.keys) return options.keys;
    if (!remoteKeys) {
      try {
        remoteKeys = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
      } catch (cause) {
        throw new TokenVerifierConfigError("SUPABASE_URL is not a valid URL", { cause });
      }
    }
    return remoteKeys;
  };
  return {
    async verify(token): Promise<AuthContext> {
      const keys = getKeys();
      const { payload } = await jwtVerify(token, keys, { issuer, audience: AUDIENCE });
      if (typeof payload.sub !== "string" || payload.sub === "") throw new Error("token has no subject");
      return { userId: payload.sub, role: toRole(payload.user_role), claims: payload };
    },
  };
}

/**
 * Creates a verifier that rejects every token; used when the Supabase URL is not configured, so the API fails closed.
 *
 * @returns A TokenVerifier that always throws.
 */
export function createRejectingTokenVerifier(): TokenVerifier {
  return {
    verify: () => Promise.reject(new Error("auth is not configured")),
  };
}
