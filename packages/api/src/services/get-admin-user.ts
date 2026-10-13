/** Use case: read one user for the admin detail page. */
import type { AdminUserDetail } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { AdminRepository } from "../ports/admin-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads one user.
 *
 * @param deps - Admin repository.
 * @param ctx - Verified admin (the database checks it again).
 * @param id - The user to read.
 * @returns The user with counts.
 * @throws {NotFoundError} When no user has that id.
 */
export async function getAdminUser(
  deps: { readonly admin: AdminRepository },
  ctx: AuthContext,
  id: string,
): Promise<AdminUserDetail> {
  const user = await deps.admin.get(ctx.userId, id);
  if (!user) throw new NotFoundError("user");
  return user;
}
