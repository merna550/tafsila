/** Test helper: a local key pair and token signer, so auth tests need no network (plan #25 test plan). */
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";

/** Milliseconds per second and the default token lifetime in seconds. */
const MS_PER_SECOND = 1000;
const DEFAULT_LIFETIME_SECONDS = 3600;

/** Project URL used as the token issuer base in tests. */
export const TEST_SUPABASE_URL = "http://127.0.0.1:54321";

/** Options for a signed test token. */
export interface TestTokenOptions {
  readonly sub?: string;
  readonly role?: string;
  readonly issuer?: string;
  readonly audience?: string;
  /** Seconds from now; negative makes an expired token. */
  readonly expiresIn?: number;
}

/** A key pair plus the key source and signer built from it. */
export interface TestAuthKeys {
  /** Key source for the verifier. */
  readonly keys: JWTVerifyGetKey;
  /** Signs a token with this pair, or with `signWith` to simulate a wrong key. */
  sign(options?: TestTokenOptions, signWith?: CryptoKey): Promise<string>;
  /** A different private key the verifier does not know. */
  readonly foreignKey: CryptoKey;
}

/**
 * Generates an ES256 key pair and returns the JWKS key source and a token signer.
 *
 * @returns Helpers for tests.
 */
export async function createTestAuthKeys(): Promise<TestAuthKeys> {
  const pair = await generateKeyPair("ES256");
  const other = await generateKeyPair("ES256");
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: "test-key", alg: "ES256", use: "sig" };
  return {
    keys: createLocalJWKSet({ keys: [jwk] }),
    foreignKey: other.privateKey,
    async sign(options = {}, signWith) {
      const jwt = new SignJWT({ user_role: options.role })
        .setProtectedHeader({ alg: "ES256", kid: "test-key" })
        .setSubject(options.sub ?? "aaaaaaaa-0000-4000-8000-000000000001")
        .setIssuer(options.issuer ?? `${TEST_SUPABASE_URL}/auth/v1`)
        .setAudience(options.audience ?? "authenticated")
        .setIssuedAt()
        .setExpirationTime(
          Math.floor(Date.now() / MS_PER_SECOND) + (options.expiresIn ?? DEFAULT_LIFETIME_SECONDS),
        );
      return jwt.sign(signWith ?? pair.privateKey);
    },
  };
}
