/** Drizzle size chart repository: reads and the admin write run through withUser, so RLS (public read, admin-only write) decides. */
import { sizeChartSchema, type UpdateSizeChartInput } from "@tafsila/schemas";
import { and, eq, isNull } from "drizzle-orm";
import { AppError } from "../../domain/errors";
import type { SizeChartRecord, SizeChartRepository } from "../../ports/size-chart-repository";
import { adminAudit, sizeCharts } from "./schema";
import type { WithUser } from "./with-user";

/** Audit action written for every admin chart save. */
const AUDIT_ACTION = "size_chart.updated";

/** Rows of the default system chart. */
const isDefaultSystemChart = and(eq(sizeCharts.isDefault, true), isNull(sizeCharts.ownerId));

/**
 * Maps a row to the record the port returns.
 *
 * @param row - Database row.
 * @returns The record with an ISO date and parsed sizes.
 */
function toRecord(row: typeof sizeCharts.$inferSelect): SizeChartRecord {
  return {
    id: row.id,
    name: row.name,
    sizes: sizeChartSchema.parse(row.sizes),
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

/**
 * Creates the Drizzle size chart repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A SizeChartRepository.
 */
export function createSizeChartRepository(withUser: WithUser): SizeChartRepository {
  return {
    getDefault: (ctx) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx.select().from(sizeCharts).where(isDefaultSystemChart);
        return row ? { id: row.id, name: row.name, sizes: sizeChartSchema.parse(row.sizes) } : undefined;
      }),
    getDefaultRecord: (ctx) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx.select().from(sizeCharts).where(isDefaultSystemChart);
        return row ? toRecord(row) : undefined;
      }),
    replaceDefault: (admin, input: UpdateSizeChartInput) =>
      withUser(admin, async (tx) => {
        const [before] = await tx.select().from(sizeCharts).where(isDefaultSystemChart);
        if (!before) return undefined;
        // RLS lets only an admin update a system chart; for anyone else (a stale admin token) the update matches no row.
        const [after] = await tx
          .update(sizeCharts)
          .set({
            name: input.name ?? before.name,
            sizes: input.sizes,
            updatedBy: admin.userId,
            updatedAt: new Date(),
          })
          .where(eq(sizeCharts.id, before.id))
          .returning();
        if (!after) throw new AppError("FORBIDDEN");
        await tx.insert(adminAudit).values({
          who: admin.userId,
          action: AUDIT_ACTION,
          target: after.id,
          before: { name: before.name, sizes: before.sizes },
          after: { name: after.name, sizes: after.sizes },
        });
        return toRecord(after);
      }),
  };
}
