/** Public entry of auth: the only module that talks to Supabase from the web app (ADR-029). */
export { decideAccess, type AccessDecision } from "./access-guard";
export { AuthProvider, useAuthClient } from "./AuthProvider";
export {
  requestReset,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  updatePassword,
  type AuthResult,
  type Credentials,
} from "./auth-actions";
export type { AuthClient, AuthConfig } from "./clients";
export { mapAuthError } from "./map-auth-error";
export { DEFAULT_AFTER_SIGN_IN, sanitizeNext } from "./safe-next";
export type { SessionUser } from "./session-user";
