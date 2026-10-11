/** Pure route guard: decides from the path and the signed-in state whether to allow, or where to redirect (plan #25, part B). */
import { DEFAULT_AFTER_SIGN_IN } from "./safe-next";

/** Outcome of the guard. */
export type AccessDecision =
  { readonly action: "allow" } | { readonly action: "redirect"; readonly to: string };

/** Paths (without the locale prefix) that need a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard"] as const;
/** Paths a signed-in user does not need. */
const GUEST_ONLY_PATHS = ["/sign-in", "/sign-up"] as const;
/** Non-default locale prefixes in URLs (Arabic has none, decision 25a-2). */
const LOCALE_PREFIX = /^\/en(?=\/|$)/;

/**
 * Tells whether a path equals a prefix or is below it.
 *
 * @param path - Path without the locale prefix.
 * @param prefix - A path such as "/dashboard".
 * @returns True when the path is the prefix or inside it.
 */
function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Decides what to do with a request.
 *
 * @param pathname - URL path including any `/en` prefix.
 * @param search - Query string including the leading "?", or "".
 * @param signedIn - Whether a valid session exists.
 * @returns Allow, or a redirect target that keeps the language prefix.
 * @example
 * decideAccess("/dashboard", "", false); // { action: "redirect", to: "/sign-in?next=%2Fdashboard" }
 */
export function decideAccess(pathname: string, search: string, signedIn: boolean): AccessDecision {
  const prefix = LOCALE_PREFIX.exec(pathname)?.[0] ?? "";
  const path = pathname.slice(prefix.length) || "/";
  if (!signedIn && PROTECTED_PREFIXES.some((p) => isUnder(path, p))) {
    return { action: "redirect", to: `${prefix}/sign-in?next=${encodeURIComponent(pathname + search)}` };
  }
  if (signedIn && GUEST_ONLY_PATHS.some((p) => isUnder(path, p))) {
    return { action: "redirect", to: `${prefix}${DEFAULT_AFTER_SIGN_IN}` };
  }
  return { action: "allow" };
}
