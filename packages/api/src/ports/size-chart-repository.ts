/** Size chart repository port: reads the system's default size chart (system data, the same for every user). */
import type { SizeChartResponse } from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** Reads size charts. Writing them is the admin editor's job (#32). */
export interface SizeChartRepository {
  /**
   * Reads the default system chart.
   *
   * @param ctx - Verified caller.
   * @returns The chart, or undefined when none is marked default.
   */
  getDefault(ctx: AuthContext): Promise<SizeChartResponse | undefined>;
}
