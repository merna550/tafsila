/** Drizzle size chart repository: reads through withUser, so RLS (system charts are public) decides what is visible. */
import { sizeChartSchema } from "@tafsila/schemas";
import { and, eq, isNull } from "drizzle-orm";
import type { SizeChartRepository } from "../../ports/size-chart-repository";
import { sizeCharts } from "./schema";
import type { WithUser } from "./with-user";

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
        const [row] = await tx
          .select()
          .from(sizeCharts)
          .where(and(eq(sizeCharts.isDefault, true), isNull(sizeCharts.ownerId)));
        return row ? { id: row.id, name: row.name, sizes: sizeChartSchema.parse(row.sizes) } : undefined;
      }),
  };
}
