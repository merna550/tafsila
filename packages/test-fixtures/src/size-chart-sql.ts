/** Builds the SQL that inserts the default size chart from the Egyptian chart fixture, so the migration and the fixture never drift (issue #31). */
import type { SizeChart } from "@tafsila/schemas";
import { EGYPTIAN_SIZE_CHART_NAME, egyptianSizeChart } from "./egyptian-size-chart";

/** Name of the default system chart (the Egyptian chart, issue #158). */
export const DEFAULT_SIZE_CHART_NAME = EGYPTIAN_SIZE_CHART_NAME;

/**
 * Renders the JSON of a chart as a SQL string literal.
 *
 * @param chart - Size chart to render.
 * @returns A single-quoted SQL literal with a `::jsonb` cast.
 */
export function sizeChartJsonLiteral(chart: SizeChart): string {
  return `'${JSON.stringify(chart).replaceAll("'", "''")}'::jsonb`;
}

/**
 * Renders the insert statement of the default system size chart.
 *
 * @param chart - Chart to insert (defaults to the Egyptian chart).
 * @returns One SQL statement.
 */
export function defaultSizeChartInsertSql(chart: SizeChart = egyptianSizeChart): string {
  return [
    "insert into public.size_charts (name, sizes, is_default, owner_id)",
    `values ('${DEFAULT_SIZE_CHART_NAME}', ${sizeChartJsonLiteral(chart)}, true, null);`,
  ].join("\n");
}
