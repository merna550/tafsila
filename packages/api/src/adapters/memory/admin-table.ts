/** In-memory admin-edited table with the same rules as the database: only an admin writes, each write adds an audit row, a duplicate id is refused. */
import { AppError } from "../../domain/errors";
import {
  fabricAuditAction,
  fabricAuditSnapshot,
  type EditTrail,
  type FabricAuditPrefix,
  type FabricAuditVerb,
} from "../../domain/fabric-audit";
import type { AuthContext } from "../../ports/token-verifier";
import type { MemoryOptions, MemoryStore } from "./memory-store";

/** A row with an id and an edit trail. */
type TableRow = { readonly id: string } & EditTrail;

/** The operations the fabric and rule repositories share. */
export interface MemoryAdminTable<Row extends TableRow, Create, Patch> {
  list(): Promise<Row[]>;
  create(admin: AuthContext, input: Create): Promise<Row>;
  update(admin: AuthContext, id: string, patch: Patch): Promise<Row | undefined>;
  remove(admin: AuthContext, id: string): Promise<boolean>;
}

/**
 * Refuses a caller who is not an admin in the users table, like the database policy (the token alone is not enough).
 *
 * @param store - Shared fake database.
 * @param admin - The caller.
 */
function assertAdmin(store: MemoryStore, admin: AuthContext): void {
  if (store.users.find((user) => user.id === admin.userId)?.role !== "admin") throw new AppError("FORBIDDEN");
}

/**
 * Runs a synchronous operation and returns its result, or its error, as a promise.
 *
 * @param operation - The work.
 * @returns A promise of the result.
 */
function settle<T>(operation: () => T): Promise<T> {
  try {
    return Promise.resolve(operation());
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Creates the operations over one list of rows.
 *
 * @param store - Shared fake database (`users` decides who is an admin, `audit` receives the audit rows).
 * @param rows - The table's rows; the operations change this array.
 * @param prefix - Audit action prefix of the table.
 * @param options - Time source for the edit trail.
 * @returns List, create, update and remove.
 */
export function createMemoryAdminTable<Row extends TableRow, Create extends { readonly id: string }, Patch>(
  store: MemoryStore,
  rows: Row[],
  prefix: FabricAuditPrefix,
  options: MemoryOptions = {},
): MemoryAdminTable<Row, Create, Patch> {
  const now = options.now ?? (() => new Date());
  /**
   * Appends one audit row.
   *
   * @param admin - The caller.
   * @param verb - What happened.
   * @param id - The row id.
   * @param change - Row before and after (absent for none).
   */
  const audit = (
    admin: AuthContext,
    verb: FabricAuditVerb,
    id: string,
    change: { before?: Row; after?: Row },
  ): void => {
    store.audit.push({
      who: admin.userId,
      action: fabricAuditAction(prefix, verb),
      target: id,
      before: change.before ? fabricAuditSnapshot(change.before) : null,
      after: change.after ? fabricAuditSnapshot(change.after) : null,
      at: now().toISOString(),
    });
  };

  return {
    list: () => Promise.resolve([...rows].sort((a, b) => a.id.localeCompare(b.id))),
    create: (admin, input) =>
      settle(() => {
        assertAdmin(store, admin);
        if (rows.some((row) => row.id === input.id)) throw new AppError("FABRIC_ID_TAKEN");
        const row = { ...input, updatedAt: now().toISOString(), updatedBy: admin.userId } as unknown as Row;
        rows.push(row);
        audit(admin, "created", row.id, { after: row });
        return row;
      }),
    update: (admin, id, patch) =>
      settle(() => {
        assertAdmin(store, admin);
        const index = rows.findIndex((row) => row.id === id);
        const before = rows[index];
        if (!before) return undefined;
        const after = { ...before, ...patch, updatedAt: now().toISOString(), updatedBy: admin.userId };
        rows[index] = after;
        audit(admin, "updated", id, { before, after });
        return after;
      }),
    remove: (admin, id) =>
      settle(() => {
        assertAdmin(store, admin);
        const index = rows.findIndex((row) => row.id === id);
        const before = rows[index];
        if (!before) return false;
        rows.splice(index, 1);
        audit(admin, "deleted", id, { before });
        return true;
      }),
  };
}
