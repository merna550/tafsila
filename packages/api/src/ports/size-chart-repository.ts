/** Size chart repository port: reads the system's default size chart (system data) and lets an admin replace it. */
import type { SizeChartResponse, UpdateSizeChartInput } from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** The default chart with its edit trail, as the admin editor needs it. */
export interface SizeChartRecord extends SizeChartResponse {
  /** When the chart was last saved (ISO). */
  readonly updatedAt: string;
  /** Id of the admin who saved it last; null for the seeded chart or a deleted editor. */
  readonly updatedBy: string | null;
}

/** Reads size charts for everyone and writes the default one for admins (#32). */
export interface SizeChartRepository {
  /**
   * Reads the default system chart.
   *
   * @param ctx - Verified caller.
   * @returns The chart, or undefined when none is marked default.
   */
  getDefault(ctx: AuthContext): Promise<SizeChartResponse | undefined>;
  /**
   * Reads the default chart with who saved it and when.
   *
   * @param ctx - Verified caller.
   * @returns The record, or undefined when none is marked default.
   */
  getDefaultRecord(ctx: AuthContext): Promise<SizeChartRecord | undefined>;
  /**
   * Replaces the sizes (and the name, when given) of the default chart and writes one `size_chart.updated` audit row
   * with the chart before and after, in one transaction. The database refuses a caller who is not an admin.
   *
   * @param admin - Verified admin (the audit row's `who`).
   * @param input - New sizes and optional new name.
   * @returns The saved record, or undefined when no default chart exists (nothing is written).
   * @throws {AppError} FORBIDDEN when the database says the caller is not an admin.
   */
  replaceDefault(admin: AuthContext, input: UpdateSizeChartInput): Promise<SizeChartRecord | undefined>;
}
