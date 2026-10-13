/** Builds the SQL that inserts the default size chart from the demo fixture, so the migration and the fixture never drift (issue #31). */
import type { SizeChart } from "@tafsila/schemas";
import { demoSizeChart } from "./size-chart";

/** Name of the placeholder system chart until #32 replaces its values. */
export const DEFAULT_SIZE_CHART_NAME = "PLACEHOLDER S-XXL (demo values, replaced in #32)";

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
 * @param chart - Chart to insert (defaults to the demo chart).
 * @returns One SQL statement.
 */
export function defaultSizeChartInsertSql(chart: SizeChart = demoSizeChart): string {
  return [
    "insert into public.size_charts (name, sizes, is_default, owner_id)",
    `values ('${DEFAULT_SIZE_CHART_NAME}', ${sizeChartJsonLiteral(chart)}, true, null);`,
  ].join("\n");
}
