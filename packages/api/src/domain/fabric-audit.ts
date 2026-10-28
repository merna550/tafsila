/** What an admin write on the fabric tables records in `admin_audit` (decision 317, ADR-32a item 5). */

/** The fields every admin-edited fabric row carries besides its data. */
export interface EditTrail {
  readonly updatedAt: string;
  readonly updatedBy: string | null;
}

/** The audit actions of the two admin-edited tables. */
export type FabricAuditPrefix = "fabric" | "fabric_rule";

/** What happened to the row. */
export type FabricAuditVerb = "created" | "updated" | "deleted";

/**
 * Builds the audit action name, such as `fabric.created`.
 *
 * @param prefix - Which table.
 * @param verb - What happened.
 * @returns The action string.
 */
export function fabricAuditAction(prefix: FabricAuditPrefix, verb: FabricAuditVerb): string {
  return `${prefix}.${verb}`;
}

/**
 * The row as the audit records it: the data without the edit trail (the audit row has its own `who` and `at`).
 *
 * @param row - A stored fabric or rule.
 * @returns The row without `updatedAt` and `updatedBy`.
 */
export function fabricAuditSnapshot<T extends EditTrail>(row: T): Omit<T, keyof EditTrail> {
  const trail: readonly string[] = ["updatedAt", "updatedBy"];
  return Object.fromEntries(Object.entries(row).filter(([key]) => !trail.includes(key))) as Omit<
    T,
    keyof EditTrail
  >;
}
