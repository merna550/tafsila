/** Checks that the default size chart migration still equals the demo fixture. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sizeChartSchema } from "@tafsila/schemas";
import { demoSizeChart } from "./size-chart";
import { defaultSizeChartInsertSql, sizeChartJsonLiteral } from "./size-chart-sql";

const MIGRATION = new URL(
  "../../../supabase/migrations/20261013120000_default_size_chart.sql",
  import.meta.url,
);

describe("default size chart SQL", () => {
  it("is exactly what the migration contains", () => {
    expect(readFileSync(MIGRATION, "utf8")).toContain(defaultSizeChartInsertSql());
  });

  it("round-trips the demo chart through the JSON literal", () => {
    const literal = sizeChartJsonLiteral(demoSizeChart);
    const json = literal.slice(1, literal.indexOf("'::jsonb")).replaceAll("''", "'");
    expect(sizeChartSchema.parse(JSON.parse(json))).toEqual(demoSizeChart);
  });

  it("escapes single quotes", () => {
    const chart = { "it's": demoSizeChart.M! };
    expect(sizeChartJsonLiteral(chart)).toContain("it''s");
  });
});
