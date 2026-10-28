/** In-memory fabric and rule repositories for tests and `pnpm api:test`; they serve the catalogue and rules held in the store. */
import type {
  AdminFabric,
  AdminFabricRule,
  CreateFabricInput,
  CreateFabricRuleInput,
  UpdateFabricInput,
  UpdateFabricRuleInput,
} from "@tafsila/schemas";
import type { FabricRepository, FabricRuleRepository } from "../../ports/fabric-repository";
import { createMemoryAdminTable } from "./admin-table";
import type { MemoryOptions, MemoryStore } from "./memory-store";

/**
 * Creates the in-memory fabric repository.
 *
 * @param store - Shared fake database (its `fabrics` list, `users` and `audit`).
 * @param options - Time source for the edit trail.
 * @returns A FabricRepository.
 */
export function createMemoryFabricRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): FabricRepository {
  const table = createMemoryAdminTable<AdminFabric, CreateFabricInput, UpdateFabricInput>(
    store,
    store.fabrics,
    "fabric",
    options,
  );
  return table;
}

/**
 * Creates the in-memory rule repository.
 *
 * @param store - Shared fake database (its `fabricRules` list, `users` and `audit`).
 * @param options - Time source for the edit trail.
 * @returns A FabricRuleRepository.
 */
export function createMemoryFabricRuleRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): FabricRuleRepository {
  const table = createMemoryAdminTable<AdminFabricRule, CreateFabricRuleInput, UpdateFabricRuleInput>(
    store,
    store.fabricRules,
    "fabric_rule",
    options,
  );
  return table;
}
