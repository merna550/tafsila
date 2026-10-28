/** Use case: remove a recommendation rule (FR-REC-03). The write and its audit row happen in one transaction. */
import { AppError } from "../domain/errors";
import type { FabricRuleRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Deletes a rule.
 *
 * @param deps - Rule repository.
 * @param admin - Verified admin.
 * @param id - Rule id.
 * @throws {AppError} FABRIC_RULE_NOT_FOUND when no rule has that id; FORBIDDEN when the caller is not an admin.
 */
export async function deleteFabricRule(
  deps: { readonly fabricRules: FabricRuleRepository },
  admin: AuthContext,
  id: string,
): Promise<void> {
  if (!(await deps.fabricRules.remove(admin, id))) throw new AppError("FABRIC_RULE_NOT_FOUND");
}
