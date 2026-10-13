/** Checks that the default size chart migration still equals the Egyptian chart fixture. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sizeChartSchema } from "@tafsila/schemas";
import { egyptianSizeChart } from "./egyptian-size-chart";
import { defaultSizeChartInsertSql, sizeChartJsonLiteral } from "./size-chart-sql";

const MIGRATION = new URL(
  "../../../supabase/migrations/20261013120000_default_size_chart.sql",
  import.meta.url,
);

describe("default size chart SQL", () => {
  it("is exactly what the migration contains", () => {
    expect(readFileSync(MIGRATION, "utf8")).toContain(defaultSizeChartInsertSql());
  });

  it("round-trips the Egyptian chart through the JSON literal", () => {
    const literal = sizeChartJsonLiteral(egyptianSizeChart);
    const json = literal.slice(1, literal.indexOf("'::jsonb")).replaceAll("''", "'");
    expect(sizeChartSchema.parse(JSON.parse(json))).toEqual(egyptianSizeChart);
  });

  it("escapes single quotes", () => {
    const chart = { "it's": egyptianSizeChart.M! };
    expect(sizeChartJsonLiteral(chart)).toContain("it''s");
  });
});
