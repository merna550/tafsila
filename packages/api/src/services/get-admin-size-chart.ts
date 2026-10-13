/** Use case: read the default size chart for the admin editor. */
import type { AdminSizeChart } from "@tafsila/schemas";
import { AppError } from "../domain/errors";
import type { AdminRepository } from "../ports/admin-repository";
import type { SizeChartRepository } from "../ports/size-chart-repository";
import type { AuthContext } from "../ports/token-verifier";
import { toAdminSizeChart } from "./admin-size-chart-shared";

/**
 * Reads the default chart with its last editor and the placeholder flag.
 *
 * @param deps - Size chart and admin repositories.
 * @param ctx - Verified admin (the database checks it again).
 * @returns The chart for the editor.
 * @throws {AppError} SIZE_CHART_NOT_FOUND when no chart is marked default (the chart is public data; the editor lookup is checked by the database).
 */
export async function getAdminSizeChart(
  deps: { readonly sizeCharts: SizeChartRepository; readonly admin: AdminRepository },
  ctx: AuthContext,
): Promise<AdminSizeChart> {
  const record = await deps.sizeCharts.getDefaultRecord(ctx);
  if (!record) throw new AppError("SIZE_CHART_NOT_FOUND");
  return toAdminSizeChart(deps, ctx, record);
}
