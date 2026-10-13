/** The verified filter of the users list and its mapping to the API's `verified` query value. */

/** Verified filter values of the list. */
export type VerifiedFilter = "all" | "verified" | "unverified";

/**
 * Maps the filter to the API's `verified` query value.
 *
 * @param filter - Screen filter.
 * @returns "true", "false" or undefined for everyone.
 */
export function verifiedParam(filter: VerifiedFilter): "true" | "false" | undefined {
  if (filter === "verified") return "true";
  return filter === "unverified" ? "false" : undefined;
}
