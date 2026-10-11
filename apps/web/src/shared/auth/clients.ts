/** Supabase auth clients: browser (cookies in the page) and server (cookies from the request). The only place that imports `@supabase` (ADR-029). */
import { createBrowserClient, createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The Supabase project settings the browser may know (public by design, handed over at runtime through PublicConfig). */
export interface AuthConfig {
  /** Supabase project URL. */
  readonly supabaseUrl: string;
  /** Supabase anon key. */
  readonly supabaseAnonKey: string;
}

/** The auth client type the rest of the app uses. */
export type AuthClient = SupabaseClient;

/**
 * Creates the browser auth client; the session is stored in cookies so the server sees it too.
 *
 * @param config - Project URL and anon key from PublicConfig.
 * @returns The client.
 */
export function createBrowserAuthClient(config: AuthConfig): AuthClient {
  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey) as AuthClient;
}

/**
 * Creates a server auth client that reads and writes the given cookies.
 *
 * @param config - Project URL and anon key.
 * @param cookies - Where the session cookies come from and go to (next/headers, or the proxy request and response).
 * @returns The client.
 */
export function createServerAuthClient(config: AuthConfig, cookies: CookieMethodsServer): AuthClient {
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, { cookies }) as AuthClient;
}
