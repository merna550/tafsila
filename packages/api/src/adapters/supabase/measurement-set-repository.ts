/** Drizzle measurement set repository: every query runs as the user through withUser, so RLS decides what is visible. */
import { measurementsSchema, type SaveMeasurementSetInput } from "@tafsila/schemas";
import { desc, eq, sql } from "drizzle-orm";
import { NotFoundError } from "../../domain/errors";
import type { MeasurementSetRepository, StoredMeasurementSet } from "../../ports/measurement-set-repository";
import { measurementSets } from "./schema";
import type { Tx, WithUser } from "./with-user";

/** Postgres error code for a foreign key violation (a client that is not the caller's). */
const FOREIGN_KEY_VIOLATION = "23503";

/** Database row of `measurement_sets`. */
type SetDbRow = typeof measurementSets.$inferSelect;

/**
 * Reads a string `code` property from any value.
 *
 * @param value - Anything.
 * @returns The code, or undefined.
 */
function codeOf(value: unknown): string | undefined {
  return typeof value === "object" && value !== null && "code" in value && typeof value.code === "string"
    ? value.code
    : undefined;
}

/**
 * Reads the SQLSTATE code of a driver error, also when Drizzle wrapped it.
 *
 * @param error - Anything thrown by a query.
 * @returns The code, or undefined.
 */
function sqlState(error: unknown): string | undefined {
  const cause = typeof error === "object" && error !== null && "cause" in error ? error.cause : undefined;
  return codeOf(error) ?? codeOf(cause);
}

/**
 * Maps a row to the API shape.
 *
 * @param row - Database row.
 * @returns The stored set with an ISO date and parsed measurements.
 */
function toSet(row: SetDbRow): StoredMeasurementSet {
  return {
    id: row.id,
    clientId: row.clientId,
    label: row.label,
    sizeLabel: row.sizeLabel,
    measurements: measurementsSchema.parse(row.data),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Inserts a set; a client that is not the caller's breaks the composite foreign key and becomes NOT_FOUND.
 *
 * @param tx - Transaction running as the user.
 * @param ownerId - The caller's id.
 * @param input - Validated set.
 * @returns The stored set.
 */
async function insertSet(
  tx: Tx,
  ownerId: string,
  input: SaveMeasurementSetInput,
): Promise<StoredMeasurementSet> {
  try {
    const [row] = await tx
      .insert(measurementSets)
      .values({
        ownerId,
        clientId: input.clientId ?? null,
        label: input.label,
        sizeLabel: input.sizeLabel ?? null,
        data: input.measurements,
      })
      .returning();
    if (!row) throw new Error("insert returned no row");
    return toSet(row);
  } catch (error) {
    if (sqlState(error) === FOREIGN_KEY_VIOLATION) throw new NotFoundError("client");
    throw error;
  }
}

/**
 * Creates the Drizzle measurement set repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A MeasurementSetRepository.
 */
export function createMeasurementSetRepository(withUser: WithUser): MeasurementSetRepository {
  return {
    create: (ctx, input) => withUser(ctx, (tx) => insertSet(tx, ctx.userId, input)),
    list: (ctx, { clientId, limit, offset }) =>
      withUser(ctx, async (tx) => {
        const where = clientId ? eq(measurementSets.clientId, clientId) : undefined;
        const rows = await tx
          .select()
          .from(measurementSets)
          .where(where)
          .orderBy(desc(measurementSets.createdAt), desc(measurementSets.id))
          .limit(limit)
          .offset(offset);
        const [counted] = await tx
          .select({ total: sql<number>`count(*)::int` })
          .from(measurementSets)
          .where(where);
        return { items: rows.map(toSet), total: counted?.total ?? 0, limit, offset };
      }),
    get: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx.select().from(measurementSets).where(eq(measurementSets.id, id));
        return row ? toSet(row) : undefined;
      }),
    update: (ctx, id, input) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .update(measurementSets)
          .set({ label: input.label, sizeLabel: input.sizeLabel ?? null, data: input.measurements })
          .where(eq(measurementSets.id, id))
          .returning();
        return row ? toSet(row) : undefined;
      }),
    remove: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const deleted = await tx
          .delete(measurementSets)
          .where(eq(measurementSets.id, id))
          .returning({ id: measurementSets.id });
        return deleted.length > 0;
      }),
  };
}
