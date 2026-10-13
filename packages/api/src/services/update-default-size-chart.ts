/** Use case: an admin replaces the default size chart (FR-MEAS-01); chart and audit row are saved together. */
import type { UpdateSizeChartInput, UpdateSizeChartResponse } from "@tafsila/schemas";
import { AppError } from "../domain/errors";
import { checkSizeChart } from "../domain/size-chart-check";
import type { AdminRepository } from "../ports/admin-repository";
import type { SizeChartRepository } from "../ports/size-chart-repository";
import type { AuthContext } from "../ports/token-verifier";
import { toAdminSizeChart } from "./admin-size-chart-shared";

/**
 * Validates every size with the engine, then saves the chart and one audit row in one transaction.
 *
 * @param deps - Size chart and admin repositories.
 * @param ctx - Verified admin.
 * @param input - New sizes and optional new name.
 * @returns The saved chart and the warnings it was saved with.
 * @throws {SizeChartInvalidError} SIZE_CHART_INVALID (422) when any size has an engine error; nothing is saved.
 * @throws {AppError} SIZE_CHART_NOT_FOUND when no chart is marked default; FORBIDDEN when the database says the caller is not an admin.
 */
export async function updateDefaultSizeChart(
  deps: { readonly sizeCharts: SizeChartRepository; readonly admin: AdminRepository },
  ctx: AuthContext,
  input: UpdateSizeChartInput,
): Promise<UpdateSizeChartResponse> {
  const warnings = checkSizeChart(input.sizes);
  const record = await deps.sizeCharts.replaceDefault(ctx, input);
  if (!record) throw new AppError("SIZE_CHART_NOT_FOUND");
  return { ...(await toAdminSizeChart(deps, ctx, record)), warnings };
}
