/** Query keys of the admin-users feature. */

/** Verified filter values of the list. */
export type VerifiedFilter = "all" | "verified" | "unverified";

/** Prefix of everything about admin users. */
const ALL = ["admin", "users"] as const;

/**
 * Key of one list.
 *
 * @param q - Search text.
 * @param filter - Verified filter.
 * @param limit - Page size.
 * @returns The query key.
 */
function list(
  q: string,
  filter: VerifiedFilter,
  limit: number,
): readonly ["admin", "users", { q: string; filter: VerifiedFilter; limit: number }] {
  return ["admin", "users", { q, filter, limit }] as const;
}

/**
 * Key of one user.
 *
 * @param id - User id.
 * @returns The query key.
 */
function detail(id: string): readonly ["admin", "users", string] {
  return ["admin", "users", id] as const;
}

/** Key of the overview numbers. */
const stats = ["admin", "stats"] as const;

/** All query keys of the feature. */
export const adminUserKeys = { all: ALL, list, detail, stats };
