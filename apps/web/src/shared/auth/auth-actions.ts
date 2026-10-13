/** Auth actions the screens call: each returns a result or a mapped ApiError, never a raw Supabase error. */
import type { ApiError } from "../api";
import type { AuthClient } from "./clients";
import { mapAuthError } from "./map-auth-error";

/** Result of an auth action. */
export type AuthResult = { readonly ok: true } | { readonly ok: false; readonly error: ApiError };

/** Credentials for email sign-in and sign-up. */
export interface Credentials {
  /** Email address. */
  readonly email: string;
  /** Password. */
  readonly password: string;
}

/** Success. */
const OK: AuthResult = { ok: true };

/**
 * Runs one supabase-js auth call and converts its error (returned or thrown) into an AuthResult.
 *
 * @param call - The call to run.
 * @returns ok, or the mapped error.
 */
async function run(
  call: () => Promise<{ error: { code?: string; status?: number; name?: string } | null }>,
): Promise<AuthResult> {
  try {
    const { error } = await call();
    return error ? { ok: false, error: mapAuthError(error) } : OK;
  } catch (thrown) {
    return { ok: false, error: mapAuthError(thrown as { code?: string; status?: number; name?: string }) };
  }
}

/**
 * Creates an account; the confirmation mail link lands on `redirectTo`.
 *
 * @param client - Browser auth client.
 * @param credentials - Email and password.
 * @param redirectTo - Where the mail link leads.
 * @returns The result.
 */
export function signUp(
  client: AuthClient,
  credentials: Credentials,
  redirectTo: string,
): Promise<AuthResult> {
  return run(() => client.auth.signUp({ ...credentials, options: { emailRedirectTo: redirectTo } }));
}

/**
 * Signs in with email and password.
 *
 * @param client - Browser auth client.
 * @param credentials - Email and password.
 * @returns The result.
 */
export function signIn(client: AuthClient, credentials: Credentials): Promise<AuthResult> {
  return run(() => client.auth.signInWithPassword(credentials));
}

/**
 * Starts Google sign-in (redirects the browser).
 *
 * @param client - Browser auth client.
 * @param redirectTo - Where Google sends the user back.
 * @returns The result.
 */
export function signInWithGoogle(client: AuthClient, redirectTo: string): Promise<AuthResult> {
  return run(() => client.auth.signInWithOAuth({ provider: "google", options: { redirectTo } }));
}

/**
 * Sends the password reset mail.
 *
 * @param client - Browser auth client.
 * @param email - Account email.
 * @param redirectTo - Where the mail link leads.
 * @returns The result.
 */
export function requestReset(client: AuthClient, email: string, redirectTo: string): Promise<AuthResult> {
  return run(() => client.auth.resetPasswordForEmail(email, { redirectTo }));
}

/**
 * Sets a new password for the signed-in (recovery) session.
 *
 * @param client - Browser auth client.
 * @param password - The new password.
 * @returns The result.
 */
export function updatePassword(client: AuthClient, password: string): Promise<AuthResult> {
  return run(() => client.auth.updateUser({ password }));
}

/**
 * Signs out and clears the session cookies.
 *
 * @param client - Browser auth client.
 * @returns The result.
 */
export function signOut(client: AuthClient): Promise<AuthResult> {
  return run(() => client.auth.signOut());
}

/**
 * Removes the session from this browser only, after the server already deleted the account: the user is gone, so the server
 * call of a normal sign-out would fail, and that failure is ignored on purpose.
 *
 * @param client - Browser auth client.
 */
export async function clearLocalSession(client: AuthClient): Promise<void> {
  try {
    await client.auth.signOut({ scope: "local" });
  } catch {
    /* the account no longer exists; the cookies are cleared by supabase-js either way */
  }
}

/**
 * Reads the current access token for API calls; the session is refreshed by supabase-js when needed.
 *
 * @param client - Browser auth client.
 * @returns The token, or null when signed out.
 */
export async function getAccessToken(client: AuthClient): Promise<string | null> {
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}
