/** Checks the Egyptian chart fixture against the CSV file Merna imports in /admin/sizes. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sizeChartSchema } from "@tafsila/schemas";
import { egyptianSizeChart } from "./egyptian-size-chart";

const CSV = new URL("../../../supabase/data/egyptian-size-chart.csv", import.meta.url);

describe("egyptianSizeChart", () => {
  it("is a valid size chart with sizes S to XXL", () => {
    expect(Object.keys(sizeChartSchema.parse(egyptianSizeChart))).toEqual(["S", "M", "L", "XL", "XXL"]);
  });

  it("holds whole millimetres equal to the cm values of the CSV file", () => {
    const [header, ...rows] = readFileSync(CSV, "utf8").trim().split("\n");
    const sizes = header!.split(",").slice(1);
    expect(rows).toHaveLength(18);
    for (const row of rows) {
      const [key, ...cells] = row.split(",");
      cells.forEach((cm, i) => {
        const mm = (egyptianSizeChart[sizes[i]!] as unknown as Record<string, number>)[key!];
        expect(mm, `${key} ${sizes[i]}`).toBe(Math.round(Number(cm) * 10));
      });
    }
  });
});
