/** Helper shared by the adapters that call `private` SQL functions through withApiRole. */
import type { sql } from "drizzle-orm";
import type { Tx } from "./with-user";

/**
 * Runs a one-row, one-column `select fn(...) as result` and returns the value.
 *
 * @param tx - Transaction.
 * @param query - The select statement.
 * @returns The `result` column.
 */
export async function scalar<T>(tx: Tx, query: ReturnType<typeof sql>): Promise<T> {
  const rows = (await tx.execute(query)) as unknown as { result: T }[];
  const row = rows[0];
  if (!row) throw new Error("private function returned no row");
  return row.result;
}
