/** Client repository port: stores the signed-in user's clients. Every method acts for `ctx` only (RLS in the database). */
import type { Client, CreateClientInput, ListClientsQuery, Page, UpdateClientInput } from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** Stores and reads the caller's clients. Another user's row behaves as if it did not exist. */
export interface ClientRepository {
  /**
   * Creates a client owned by the caller (any owner in the input is ignored).
   *
   * @param ctx - Verified caller.
   * @param input - Name and notes.
   * @returns The stored client.
   */
  create(ctx: AuthContext, input: CreateClientInput): Promise<Client>;
  /**
   * Lists the caller's clients, newest first.
   *
   * @param ctx - Verified caller.
   * @param query - Name search and paging.
   * @returns One page with the total.
   */
  list(ctx: AuthContext, query: ListClientsQuery): Promise<Page<Client>>;
  /**
   * Counts the caller's clients (plan limits).
   *
   * @param ctx - Verified caller.
   * @returns How many clients the caller has.
   */
  count(ctx: AuthContext): Promise<number>;
  /**
   * Reads one client.
   *
   * @param ctx - Verified caller.
   * @param id - Client id.
   * @returns The client, or undefined when missing or not the caller's.
   */
  get(ctx: AuthContext, id: string): Promise<Client | undefined>;
  /**
   * Changes name and/or notes.
   *
   * @param ctx - Verified caller.
   * @param id - Client id.
   * @param patch - Fields to change.
   * @returns The updated client, or undefined when missing or not the caller's.
   */
  update(ctx: AuthContext, id: string, patch: UpdateClientInput): Promise<Client | undefined>;
  /**
   * Deletes a client; its measurement sets go with it.
   *
   * @param ctx - Verified caller.
   * @param id - Client id.
   * @returns True when a row was deleted.
   */
  remove(ctx: AuthContext, id: string): Promise<boolean>;
}
