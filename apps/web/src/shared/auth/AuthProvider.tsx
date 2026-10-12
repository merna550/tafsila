"use client";
/** Provides the browser auth client to hooks, built once from the PublicConfig handed over by the layout (no NEXT_PUBLIC_*, ADR-025). */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  type ReactElement,
  type ReactNode,
} from "react";
import { setAccessTokenGetter } from "../api";
import { getAccessToken } from "./auth-actions";
import { createBrowserAuthClient, type AuthClient, type AuthConfig } from "./clients";

const AuthClientContext = createContext<AuthClient | null>(null);

/** Props for {@link AuthProvider}. */
interface AuthProviderProps {
  /** Supabase settings from PublicConfig; undefined when auth is not configured. */
  readonly config: Partial<AuthConfig>;
  /** The app. */
  readonly children: ReactNode;
}

/**
 * Creates the auth client and tells the API client how to read the access token.
 *
 * @param props - The config and children.
 * @returns The provider.
 */
export function AuthProvider({ config, children }: Readonly<AuthProviderProps>): ReactElement {
  const { supabaseUrl, supabaseAnonKey } = config;
  const client = useMemo(
    () => (supabaseUrl && supabaseAnonKey ? createBrowserAuthClient({ supabaseUrl, supabaseAnonKey }) : null),
    [supabaseUrl, supabaseAnonKey],
  );
  // A layout effect runs before every child's effect, so a hook that loads data on mount already finds the token.
  useLayoutEffect(() => {
    if (!client) return;
    setAccessTokenGetter(() => getAccessToken(client));
    return () => setAccessTokenGetter(null);
  }, [client]);
  return <AuthClientContext.Provider value={client}>{children}</AuthClientContext.Provider>;
}

/**
 * Returns the auth client for hooks that sign in, sign out or reset.
 *
 * @returns The client.
 * @throws {Error} When auth is not configured (a setup error, not a user error).
 */
export function useAuthClient(): AuthClient {
  const client = useContext(AuthClientContext);
  if (!client) throw new Error("Auth is not configured: SUPABASE_URL and SUPABASE_ANON_KEY are missing");
  return client;
}
