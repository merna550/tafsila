/** Use case: add a recommendation rule (FR-REC-03). Unknown paths and values are refused before anything is written. */
import type { AdminFabricRule, CreateFabricRuleInput } from "@tafsila/schemas";
import { checkFabricRule } from "../domain/fabric-checks";
import type { FabricRuleRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Adds a rule.
 *
 * @param deps - Rule repository.
 * @param admin - Verified admin.
 * @param input - The new rule.
 * @returns The stored rule.
 * @throws {FabricRuleInvalidError} When a condition names an unknown path or value (422).
 * @throws {AppError} FABRIC_ID_TAKEN when the id exists; FORBIDDEN when the caller is not an admin.
 */
export function createFabricRule(
  deps: { readonly fabricRules: FabricRuleRepository },
  admin: AuthContext,
  input: CreateFabricRuleInput,
): Promise<AdminFabricRule> {
  checkFabricRule(input);
  return deps.fabricRules.create(admin, input);
}
