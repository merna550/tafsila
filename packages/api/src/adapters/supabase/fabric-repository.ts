/** Drizzle fabric and rule repositories: every query runs as the user through withUser, so RLS (read for all, write for admins) decides; each write adds its admin_audit row in the same transaction (ADR-32a). */
import type { AdminFabric, AdminFabricRule, UpdateFabricRuleInput } from "@tafsila/schemas";
import { asc, eq } from "drizzle-orm";
import { AppError } from "../../domain/errors";
import {
  fabricAuditAction,
  fabricAuditSnapshot,
  type FabricAuditPrefix,
  type FabricAuditVerb,
} from "../../domain/fabric-audit";
import type { FabricRepository, FabricRuleRepository } from "../../ports/fabric-repository";
import type { AuthContext } from "../../ports/token-verifier";
import { adminAudit, fabricRules, fabrics } from "./schema";
import { sqlState } from "./sql-state";
import type { Tx, WithUser } from "./with-user";

/** SQLSTATE of a duplicate primary key. */
const UNIQUE_VIOLATION = "23505";

/** SQLSTATE of a row refused by a row level security policy or a missing privilege. */
const INSUFFICIENT_PRIVILEGE = "42501";

/**
 * Maps a database refusal of a write to the domain error: a duplicate id, or a caller who is not an admin.
 *
 * @param error - Thrown value.
 * @throws {AppError} FABRIC_ID_TAKEN or FORBIDDEN; any other error is rethrown unchanged.
 */
function rethrowWriteError(error: unknown): never {
  const state = sqlState(error);
  if (state === UNIQUE_VIOLATION) throw new AppError("FABRIC_ID_TAKEN");
  if (state === INSUFFICIENT_PRIVILEGE) throw new AppError("FORBIDDEN");
  throw error;
}

/**
 * Maps a fabric row to the admin shape.
 *
 * @param row - Database row.
 * @returns The fabric with an ISO date.
 */
function toFabric(row: typeof fabrics.$inferSelect): AdminFabric {
  return {
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    properties: row.properties,
    careNotes: row.careNotes,
    isDraft: row.isDraft,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

/**
 * Maps a rule row to the admin shape (`condition` is `when`, `required_properties` is `effect`).
 *
 * @param row - Database row.
 * @returns The rule with an ISO date.
 */
function toRule(row: typeof fabricRules.$inferSelect): AdminFabricRule {
  return {
    id: row.id,
    when: row.condition,
    effect: row.requiredProperties,
    priority: row.priority,
    reason: row.reason,
    isDraft: row.isDraft,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

/**
 * Maps the changed fields of a rule to the columns they live in.
 *
 * @param patch - Fields from the API.
 * @returns The column values to set.
 */
function ruleColumns(patch: UpdateFabricRuleInput): Partial<typeof fabricRules.$inferInsert> {
  const { when, effect, ...same } = patch;
  return {
    ...same,
    ...(when ? { condition: when } : {}),
    ...(effect ? { requiredProperties: effect } : {}),
  };
}

/**
 * Writes the audit row of an admin change, inside the change's transaction.
 *
 * @param tx - Transaction of the admin.
 * @param admin - Verified admin (`who`).
 * @param event - Table, verb and row id.
 * @param change - The row before and after (undefined for none).
 */
async function writeAudit(
  tx: Tx,
  admin: AuthContext,
  event: { readonly prefix: FabricAuditPrefix; readonly verb: FabricAuditVerb; readonly id: string },
  change: { readonly before?: AdminFabric | AdminFabricRule; readonly after?: AdminFabric | AdminFabricRule },
): Promise<void> {
  await tx.insert(adminAudit).values({
    who: admin.userId,
    action: fabricAuditAction(event.prefix, event.verb),
    target: event.id,
    before: change.before ? fabricAuditSnapshot(change.before) : null,
    after: change.after ? fabricAuditSnapshot(change.after) : null,
  });
}

/**
 * Changes a rule inside the admin's transaction and writes its audit row.
 *
 * @param tx - Transaction of the admin.
 * @param admin - Verified admin.
 * @param id - Rule id.
 * @param patch - Fields to change.
 * @returns The changed rule, or undefined when no rule has that id.
 */
async function updateRuleIn(
  tx: Tx,
  admin: AuthContext,
  id: string,
  patch: UpdateFabricRuleInput,
): Promise<AdminFabricRule | undefined> {
  const [before] = await tx.select().from(fabricRules).where(eq(fabricRules.id, id));
  if (!before) return undefined;
  const [row] = await tx
    .update(fabricRules)
    .set({ ...ruleColumns(patch), updatedBy: admin.userId, updatedAt: new Date() })
    .where(eq(fabricRules.id, id))
    .returning();
  if (!row) throw new AppError("FORBIDDEN");
  const after = toRule(row);
  await writeAudit(
    tx,
    admin,
    { prefix: "fabric_rule", verb: "updated", id },
    { before: toRule(before), after },
  );
  return after;
}

/**
 * Deletes a rule inside the admin's transaction and writes its audit row.
 *
 * @param tx - Transaction of the admin.
 * @param admin - Verified admin.
 * @param id - Rule id.
 * @returns True when the rule existed.
 */
async function removeRuleIn(tx: Tx, admin: AuthContext, id: string): Promise<boolean> {
  const [before] = await tx.select().from(fabricRules).where(eq(fabricRules.id, id));
  if (!before) return false;
  const removed = await tx
    .delete(fabricRules)
    .where(eq(fabricRules.id, id))
    .returning({ id: fabricRules.id });
  if (removed.length === 0) throw new AppError("FORBIDDEN");
  await writeAudit(tx, admin, { prefix: "fabric_rule", verb: "deleted", id }, { before: toRule(before) });
  return true;
}

/**
 * Creates the Drizzle fabric repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A FabricRepository.
 */
export function createFabricRepository(withUser: WithUser): FabricRepository {
  return {
    list: (ctx) =>
      withUser(ctx, async (tx) => (await tx.select().from(fabrics).orderBy(asc(fabrics.id))).map(toFabric)),
    create: (admin, input) =>
      withUser(admin, async (tx) => {
        const [row] = await tx
          .insert(fabrics)
          .values({ ...input, updatedBy: admin.userId, updatedAt: new Date() })
          .returning();
        if (!row) throw new Error("insert returned no row");
        const created = toFabric(row);
        await writeAudit(
          tx,
          admin,
          { prefix: "fabric", verb: "created", id: created.id },
          { after: created },
        );
        return created;
      }).catch(rethrowWriteError),
    update: (admin, id, patch) =>
      withUser(admin, async (tx) => {
        const [before] = await tx.select().from(fabrics).where(eq(fabrics.id, id));
        if (!before) return undefined;
        // RLS lets only an admin update; for anyone else (a stale admin token) the update matches no row.
        const [row] = await tx
          .update(fabrics)
          .set({ ...patch, updatedBy: admin.userId, updatedAt: new Date() })
          .where(eq(fabrics.id, id))
          .returning();
        if (!row) throw new AppError("FORBIDDEN");
        const after = toFabric(row);
        await writeAudit(
          tx,
          admin,
          { prefix: "fabric", verb: "updated", id },
          { before: toFabric(before), after },
        );
        return after;
      }).catch(rethrowWriteError),
    remove: (admin, id) =>
      withUser(admin, async (tx) => {
        const [before] = await tx.select().from(fabrics).where(eq(fabrics.id, id));
        if (!before) return false;
        const removed = await tx.delete(fabrics).where(eq(fabrics.id, id)).returning({ id: fabrics.id });
        if (removed.length === 0) throw new AppError("FORBIDDEN");
        await writeAudit(tx, admin, { prefix: "fabric", verb: "deleted", id }, { before: toFabric(before) });
        return true;
      }).catch(rethrowWriteError),
  };
}

/**
 * Creates the Drizzle rule repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A FabricRuleRepository.
 */
export function createFabricRuleRepository(withUser: WithUser): FabricRuleRepository {
  return {
    list: (ctx) =>
      withUser(ctx, async (tx) =>
        (await tx.select().from(fabricRules).orderBy(asc(fabricRules.id))).map(toRule),
      ),
    create: (admin, input) =>
      withUser(admin, async (tx) => {
        const { when, effect, ...same } = input;
        const [row] = await tx
          .insert(fabricRules)
          .values({
            ...same,
            condition: when,
            requiredProperties: effect,
            updatedBy: admin.userId,
            updatedAt: new Date(),
          })
          .returning();
        if (!row) throw new Error("insert returned no row");
        const created = toRule(row);
        await writeAudit(
          tx,
          admin,
          { prefix: "fabric_rule", verb: "created", id: created.id },
          { after: created },
        );
        return created;
      }).catch(rethrowWriteError),
    update: (admin, id, patch) =>
      withUser(admin, (tx) => updateRuleIn(tx, admin, id, patch)).catch(rethrowWriteError),
    remove: (admin, id) => withUser(admin, (tx) => removeRuleIn(tx, admin, id)).catch(rethrowWriteError),
  };
}
