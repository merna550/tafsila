/** In-memory account deletion ports for tests and `pnpm api:test`: they record what was asked and mimic the cascade. */
import type { AccountAudit } from "../../ports/account-audit";
import type { AccountDeleter } from "../../ports/account-deleter";
import type { IdentityEraser } from "../../ports/identity-eraser";
import type { UserFilesRemover } from "../../ports/user-files-remover";
import type { MemoryStore } from "./memory-store";

/** The four ports plus the log and the failure switches tests use. */
export interface MemoryAccountDeletion {
  readonly userFilesRemover: UserFilesRemover;
  readonly identityEraser: IdentityEraser;
  readonly accountDeleter: AccountDeleter;
  readonly accountAudit: AccountAudit;
  /** Every call in order, as `step:argument` (the audit step has no argument, so no id can leak into it). */
  readonly calls: string[];
  /** Makes the named step reject on its next calls. */
  failAt(step: "files" | "identity" | "deleter" | "audit" | undefined): void;
  /** Files stored per user (the fake storage). */
  readonly files: Map<string, string[]>;
}

/**
 * Creates the fakes on the shared fake database; deleting a user removes their rows like the database cascade.
 *
 * @param store - Shared fake database.
 * @returns The fakes.
 */
export function createMemoryAccountDeletion(store: MemoryStore): MemoryAccountDeletion {
  const calls: string[] = [];
  const files = new Map<string, string[]>();
  let failing: string | undefined;
  /**
   * Records a step and fails it when switched on.
   *
   * @param step - Step name.
   * @param argument - Argument to log, if any.
   * @returns A promise that rejects when the step is switched to fail.
   */
  const run = (step: string, argument?: string): Promise<void> => {
    calls.push(argument === undefined ? step : `${step}:${argument}`);
    return failing === step ? Promise.reject(new Error(`${step} failed`)) : Promise.resolve();
  };
  return {
    calls,
    files,
    failAt: (step) => {
      failing = step;
    },
    userFilesRemover: {
      removeAll: async (userId) => {
        await run("files", userId);
        files.delete(userId);
      },
    },
    identityEraser: { erase: (userId) => run("identity", userId) },
    accountDeleter: {
      deleteUser: async (userId) => {
        await run("deleter", userId);
        store.clients = store.clients.filter((row) => row.ownerId !== userId);
        store.sets = store.sets.filter((row) => row.ownerId !== userId);
        store.designs = store.designs.filter((row) => row.ownerId !== userId);
        store.versions = store.versions.filter((row) => row.ownerId !== userId);
        store.profiles.delete(userId);
        store.deletedUsers.add(userId);
      },
    },
    accountAudit: { recordDeleted: () => run("audit") },
  };
}
