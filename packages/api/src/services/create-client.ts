/** Use case: create a client, unless the plan limit says no. */
import type { Client, CreateClientInput } from "@tafsila/schemas";
import { AppError } from "../domain/errors";
import type { ClientRepository } from "../ports/client-repository";
import type { PlanLimits } from "../ports/plan-limits";
import type { AuthContext } from "../ports/token-verifier";

/** Ports this use case needs. */
export interface CreateClientDeps {
  readonly clients: ClientRepository;
  readonly planLimits: PlanLimits;
}

/**
 * Creates a client for the caller after checking the plan limit.
 *
 * @param deps - Client repository and plan limits.
 * @param ctx - Verified caller.
 * @param input - Validated name and notes.
 * @returns The stored client.
 * @throws {AppError} FORBIDDEN when the plan does not allow another client.
 */
export async function createClient(
  deps: CreateClientDeps,
  ctx: AuthContext,
  input: CreateClientInput,
): Promise<Client> {
  const count = await deps.clients.count(ctx);
  if (!(await deps.planLimits.canAddClient(ctx, count))) throw new AppError("FORBIDDEN");
  return deps.clients.create(ctx, input);
}
