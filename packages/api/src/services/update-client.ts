/** Use case: change a client's name and/or notes. */
import type { Client, UpdateClientInput } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { ClientRepository } from "../ports/client-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Updates a client.
 *
 * @param deps - Client repository.
 * @param ctx - Verified caller.
 * @param id - Client id.
 * @param patch - Fields to change.
 * @returns The updated client.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function updateClient(
  deps: { readonly clients: ClientRepository },
  ctx: AuthContext,
  id: string,
  patch: UpdateClientInput,
): Promise<Client> {
  const client = await deps.clients.update(ctx, id, patch);
  if (!client) throw new NotFoundError("client");
  return client;
}
