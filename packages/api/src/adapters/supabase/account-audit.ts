/** AccountAudit through the `api_app` door: calls `private.record_account_deleted()`, which writes one anonymous audit row. */
import { sql } from "drizzle-orm";
import type { AccountAudit } from "../../ports/account-audit";
import type { WithApiRole } from "./with-user";

/**
 * Creates the audit adapter.
 *
 * @param withApiRole - Door to the private functions.
 * @returns An AccountAudit.
 */
export function createAccountAudit(withApiRole: WithApiRole): AccountAudit {
  return {
    recordDeleted: () =>
      withApiRole(async (tx) => {
        await tx.execute(sql`select private.record_account_deleted()`);
      }),
  };
}
