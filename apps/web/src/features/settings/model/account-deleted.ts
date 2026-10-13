/** The one-time flag that carries "your account was deleted" from the settings screen to the home page. */

/** Query parameter name. */
export const ACCOUNT_DELETED_PARAM = "account";
/** Query parameter value. */
export const ACCOUNT_DELETED_VALUE = "deleted";

/**
 * Builds the home page address the browser opens after the account is deleted.
 *
 * @param locale - Page language, so the notice is shown in it.
 * @returns A path such as `/?account=deleted` (Arabic) or `/en?account=deleted`.
 */
export function accountDeletedPath(locale: "ar" | "en"): string {
  const home = locale === "en" ? "/en" : "/";
  return `${home}?${ACCOUNT_DELETED_PARAM}=${ACCOUNT_DELETED_VALUE}`;
}

/**
 * Tells whether a query string carries the flag.
 *
 * @param search - Query string with or without "?".
 * @returns True when the account was just deleted.
 */
export function hasAccountDeletedFlag(search: string): boolean {
  return new URLSearchParams(search).get(ACCOUNT_DELETED_PARAM) === ACCOUNT_DELETED_VALUE;
}
