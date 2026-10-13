/** Use case: list users for the admin screen. */
import type { AdminUser, ListAdminUsersQuery, Page } from "@tafsila/schemas";
import type { AdminRepository } from "../ports/admin-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists users, newest first, with search and the verified-phone filter.
 *
 * @param deps - Admin repository.
 * @param ctx - Verified admin (the database checks it again).
 * @param query - Search, filter and paging.
 * @returns One page of users.
 */
export function listAdminUsers(
  deps: { readonly admin: AdminRepository },
  ctx: AuthContext,
  query: ListAdminUsersQuery,
): Promise<Page<AdminUser>> {
  return deps.admin.list(ctx.userId, query);
}
