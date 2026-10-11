/** Server logic of the two auth route handlers; the files under `app/auth/` only call these (Supabase stays in `shared/auth`, ADR-029). */
import { loadPublicConfig } from "@tafsila/config";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  callbackDestination,
  confirmDestination,
  LINK_FAILED_PATH,
  parseConfirmType,
} from "./auth-redirects";
import { createServerAuthClient, type AuthClient } from "./clients";

/**
 * Builds a server auth client whose cookie writes go to the response of a route handler.
 *
 * @returns The client, or null when Supabase is not configured.
 */
async function routeClient(): Promise<AuthClient | null> {
  const { supabaseUrl, supabaseAnonKey } = loadPublicConfig();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const store = await cookies();
  return createServerAuthClient(
    { supabaseUrl, supabaseAnonKey },
    {
      getAll: () => store.getAll(),
      setAll: (all) => {
        for (const { name, value, options } of all) store.set(name, value, options);
      },
    },
  );
}

/**
 * Redirects to a path of this site.
 *
 * @param request - The incoming request (gives the site's origin).
 * @param path - Path with optional query.
 * @returns The redirect response.
 */
function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

/**
 * Handles `/auth/confirm?token_hash=…&type=…`: verifies the mail link (works on another device, unlike a PKCE code)
 * and opens the session. Any problem ends on the sign-in screen with a "link invalid" notice.
 *
 * @param request - The incoming request.
 * @returns A redirect.
 */
export async function handleConfirm(request: NextRequest): Promise<NextResponse> {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = parseConfirmType(request.nextUrl.searchParams.get("type"));
  const client = await routeClient();
  if (!client || !tokenHash || !type) return redirectTo(request, LINK_FAILED_PATH);
  const { error } = await client.auth.verifyOtp({ type, token_hash: tokenHash });
  return redirectTo(request, error ? LINK_FAILED_PATH : confirmDestination(type));
}

/**
 * Handles `/auth/callback?code=…` after Google: exchanges the code for a session cookie.
 *
 * @param request - The incoming request.
 * @returns A redirect.
 */
export async function handleCallback(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const client = await routeClient();
  if (!client || !code) return redirectTo(request, LINK_FAILED_PATH);
  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error) return redirectTo(request, LINK_FAILED_PATH);
  return redirectTo(
    request,
    callbackDestination(request.nextUrl.searchParams.get("next"), data.user?.created_at, new Date()),
  );
}
