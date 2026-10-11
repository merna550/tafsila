/** Proxy (Next 16 middleware): negotiates the locale and redirects to the right URL prefix. */
import createMiddleware from "next-intl/middleware";
import { routing } from "./shared/i18n/routing";

export default createMiddleware(routing);

/** Skips API routes, Next internals and files with an extension. */
export const config = { matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"] };
