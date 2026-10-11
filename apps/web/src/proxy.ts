/** Proxy (Next 16 middleware): negotiates the locale, refreshes the Supabase session, and guards signed-in pages (plan #25, part B). */
import { loadPublicConfig } from "@tafsila/config";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { decideAccess } from "./shared/auth";
import { updateSession } from "./shared/auth/server";
import { routing } from "./shared/i18n/routing";

const handleLocale = createMiddleware(routing);

/**
 * Applies the locale, refreshes the session cookies on the same response, then redirects when the guard says so.
 *
 * @param request - The incoming request.
 * @returns The response to send.
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const response = handleLocale(request);
  // The locale middleware already redirects to the canonical URL (for example /ar to /); guard the final URL next time.
  if (response.headers.has("location")) return response;
  const { supabaseUrl, supabaseAnonKey } = loadPublicConfig();
  if (!supabaseUrl || !supabaseAnonKey) return response;
  const user = await updateSession(request, response, { supabaseUrl, supabaseAnonKey });
  const { pathname, search } = request.nextUrl;
  const decision = decideAccess(pathname, search, user !== null);
  if (decision.action === "allow") return response;
  const redirect = NextResponse.redirect(new URL(decision.to, request.url));
  // Keep refreshed session cookies on the redirect too.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

/** Skips API routes, Next internals and files with an extension. */
export const config = { matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"] };
