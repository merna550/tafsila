/** Use case: change a recommendation rule (FR-REC-03). The merged rule is checked before anything is written. */
import type { AdminFabricRule, UpdateFabricRuleInput } from "@tafsila/schemas";
import { AppError } from "../domain/errors";
import { checkFabricRule } from "../domain/fabric-checks";
import type { FabricRuleRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Changes the given fields of a rule.
 *
 * @param deps - Rule repository.
 * @param admin - Verified admin.
 * @param id - Rule id.
 * @param patch - Fields to change.
 * @returns The stored rule.
 * @throws {AppError} FABRIC_RULE_NOT_FOUND when no rule has that id; FORBIDDEN when the caller is not an admin.
 * @throws {FabricRuleInvalidError} When the merged rule names an unknown path or value (422).
 */
export async function updateFabricRule(
  deps: { readonly fabricRules: FabricRuleRepository },
  admin: AuthContext,
  id: string,
  patch: UpdateFabricRuleInput,
): Promise<AdminFabricRule> {
  const current = (await deps.fabricRules.list(admin)).find((rule) => rule.id === id);
  if (!current) throw new AppError("FABRIC_RULE_NOT_FOUND");
  checkFabricRule({ ...current, ...patch });
  const rule = await deps.fabricRules.update(admin, id, patch);
  if (!rule) throw new AppError("FABRIC_RULE_NOT_FOUND");
  return rule;
}
