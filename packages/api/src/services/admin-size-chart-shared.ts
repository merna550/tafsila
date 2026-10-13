/** Shared by the admin size chart use cases: turns a stored record into the admin response. */
import { isPlaceholderChartName, type AdminSizeChart } from "@tafsila/schemas";
import type { AdminRepository } from "../ports/admin-repository";
import type { SizeChartRecord } from "../ports/size-chart-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Builds the admin view of a chart: the last editor's display name and the placeholder flag.
 *
 * @param deps - Admin repository (to look the editor up).
 * @param ctx - Verified admin.
 * @param record - The stored chart.
 * @returns The chart as GET and PUT /admin/size-charts/default return it.
 */
export async function toAdminSizeChart(
  deps: { readonly admin: AdminRepository },
  ctx: AuthContext,
  record: SizeChartRecord,
): Promise<AdminSizeChart> {
  const editor = record.updatedBy ? await deps.admin.get(ctx.userId, record.updatedBy) : undefined;
  return {
    id: record.id,
    name: record.name,
    sizes: record.sizes,
    updatedAt: record.updatedAt,
    updatedBy: editor ? (editor.name ?? editor.email) : null,
    isPlaceholder: isPlaceholderChartName(record.name),
  };
}
