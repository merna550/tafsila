/** Use case: read the default size chart the measurement form starts from. */
import type { SizeChartResponse } from "@tafsila/schemas";
import { AppError } from "../domain/errors";
import type { SizeChartRepository } from "../ports/size-chart-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads the default size chart.
 *
 * @param deps - Size chart repository.
 * @param ctx - Verified caller.
 * @returns The chart with every size.
 * @throws {AppError} SIZE_CHART_NOT_FOUND when no chart is marked default.
 */
export async function getDefaultSizeChart(
  deps: { readonly sizeCharts: SizeChartRepository },
  ctx: AuthContext,
): Promise<SizeChartResponse> {
  const chart = await deps.sizeCharts.getDefault(ctx);
  if (!chart) throw new AppError("SIZE_CHART_NOT_FOUND");
  return chart;
}
