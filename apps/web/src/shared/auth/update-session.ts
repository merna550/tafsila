/** Session refresh for the proxy: reads the request cookies, refreshes the session, and writes the new cookies on the response. */
import type { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient, type AuthConfig } from "./clients";
import { readSessionUser, type SessionUser } from "./session-user";

/**
 * Refreshes the Supabase session for this request. Cookies Supabase wants to set are copied onto `response`,
 * which keeps next-intl's own headers and cookies intact (one response, two writers).
 *
 * @param request - The incoming request.
 * @param response - The response built so far (from next-intl); modified in place.
 * @param config - Project URL and anon key.
 * @returns The signed-in user or null.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
  config: AuthConfig,
): Promise<SessionUser | null> {
  const client = createServerAuthClient(config, {
    getAll: () => request.cookies.getAll(),
    setAll: (all) => {
      for (const { name, value, options } of all) response.cookies.set(name, value, options);
    },
  });
  return readSessionUser(client);
}
