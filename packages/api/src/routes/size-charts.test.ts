import { measurementsSchema, sizeChartResponseSchema } from "@tafsila/schemas";
import { demoSizeChart } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createMemoryApp, USER_A } from "../test-support/memory-app";

const CHART = { id: "00000000-0000-4000-8000-0000000000d1", name: "Demo", sizes: demoSizeChart };

describe("GET /api/size-charts/default", () => {
  it("returns the chart with every size valid against measurementsSchema", async () => {
    const api = await createMemoryApp();
    const { store } = api;
    store.sizeCharts.push(CHART);
    const response = await api.call(USER_A, "GET", "/size-charts/default");
    expect(response.status).toBe(200);
    const body = sizeChartResponseSchema.parse(await response.json());
    expect(Object.keys(body.sizes)).toEqual(["S", "M", "L", "XL", "XXL"]);
    for (const size of Object.values(body.sizes))
      expect(measurementsSchema.safeParse(size).success).toBe(true);
  });

  it("answers 404 SIZE_CHART_NOT_FOUND when no chart exists", async () => {
    const api = await createMemoryApp();
    const response = await api.call(USER_A, "GET", "/size-charts/default");
    expect(response.status).toBe(404);
    expect(((await response.json()) as { code: string }).code).toBe("SIZE_CHART_NOT_FOUND");
  });

  it("answers 401 without a token", async () => {
    const api = await createMemoryApp();
    const { store } = api;
    store.sizeCharts.push(CHART);
    expect((await api.call(undefined, "GET", "/size-charts/default")).status).toBe(401);
  });
});
