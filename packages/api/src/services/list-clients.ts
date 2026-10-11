/** Use case: list the caller's clients with name search and paging. */
import type { Client, ListClientsQuery, Page } from "@tafsila/schemas";
import type { ClientRepository } from "../ports/client-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists the caller's clients, newest first.
 *
 * @param deps - Client repository.
 * @param ctx - Verified caller.
 * @param query - Name search and paging.
 * @returns One page of clients.
 */
export function listClients(
  deps: { readonly clients: ClientRepository },
  ctx: AuthContext,
  query: ListClientsQuery,
): Promise<Page<Client>> {
  return deps.clients.list(ctx, query);
}
