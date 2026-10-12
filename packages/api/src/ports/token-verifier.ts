/** Token verifier port: turns a bearer access token into verified claims, or fails. The adapter owns the crypto (jose). */

/** Roles stored in profiles.role and carried in the access token. */
export type UserRole = "user" | "admin";

/** What the API trusts after one successful verification of a Supabase access token. */
export interface AuthContext {
  /** The signed-in user's id (the token `sub`). */
  readonly userId: string;
  /** The role from the `user_role` claim added by the custom access token hook; `user` when absent. */
  readonly role: UserRole;
  /** All verified claims, reused by later steps (for example withUser) so the token is verified only once. */
  readonly claims: Readonly<Record<string, unknown>>;
}

/** Verifies access tokens. */
export interface TokenVerifier {
  /**
   * Verifies signature, issuer, audience and expiry.
   *
   * @param token - The raw JWT from the Authorization header.
   * @returns The verified context.
   * @throws {Error} When the token is invalid for any reason (the middleware maps it to UNAUTHENTICATED).
   */
  verify(token: string): Promise<AuthContext>;
}

/** Thrown by a verifier when the server itself is misconfigured (not when the token is bad); the middleware lets it become a 500. */
export class TokenVerifierConfigError extends Error {
  /**
   * Creates the error.
   *
   * @param message - What is misconfigured.
   * @param options - Optional cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TokenVerifierConfigError";
  }
}
