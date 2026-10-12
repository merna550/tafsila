/** Use case: delete a client and, through the foreign key, its measurement sets. */
import { NotFoundError } from "../domain/errors";
import type { ClientRepository } from "../ports/client-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Deletes a client.
 *
 * @param deps - Client repository.
 * @param ctx - Verified caller.
 * @param id - Client id.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function deleteClient(
  deps: { readonly clients: ClientRepository },
  ctx: AuthContext,
  id: string,
): Promise<void> {
  if (!(await deps.clients.remove(ctx, id))) throw new NotFoundError("client");
}
