/** Use case: the numbers on the admin overview. */
import type { AdminStats } from "@tafsila/schemas";
import type { AdminRepository } from "../ports/admin-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads users, verified phones, sign-ups and clients.
 *
 * @param deps - Admin repository.
 * @param ctx - Verified admin (the database checks it again).
 * @returns The numbers.
 */
export function getAdminStats(
  deps: { readonly admin: AdminRepository },
  ctx: AuthContext,
): Promise<AdminStats> {
  return deps.admin.stats(ctx.userId);
}
