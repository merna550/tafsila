/** Use case: read one client of the caller. */
import type { Client } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { ClientRepository } from "../ports/client-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads a client.
 *
 * @param deps - Client repository.
 * @param ctx - Verified caller.
 * @param id - Client id.
 * @returns The client.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function getClient(
  deps: { readonly clients: ClientRepository },
  ctx: AuthContext,
  id: string,
): Promise<Client> {
  const client = await deps.clients.get(ctx, id);
  if (!client) throw new NotFoundError("client");
  return client;
}
