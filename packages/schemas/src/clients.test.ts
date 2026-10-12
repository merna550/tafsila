import { describe, expect, it } from "vitest";
import {
  clientSummarySchema,
  createClientInputSchema,
  listClientsQuerySchema,
  updateClientInputSchema,
} from "./clients";
import { pageOf } from "./pagination";
import { z } from "zod";

describe("client schemas", () => {
  it("trims the name and rejects an empty one", () => {
    expect(createClientInputSchema.parse({ name: "  منى " }).name).toBe("منى");
    expect(createClientInputSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("requires at least one field to update, and lets notes be cleared with null", () => {
    expect(updateClientInputSchema.safeParse({}).success).toBe(false);
    expect(updateClientInputSchema.safeParse({ notes: null }).success).toBe(true);
  });

  it("coerces paging from strings and applies defaults and bounds", () => {
    expect(listClientsQuerySchema.parse({})).toEqual({ limit: 20, offset: 0 });
    expect(listClientsQuerySchema.parse({ limit: "10", offset: "5" })).toMatchObject({
      limit: 10,
      offset: 5,
    });
    expect(listClientsQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(listClientsQuerySchema.safeParse({ offset: "-1" }).success).toBe(false);
  });

  it("builds a page schema", () => {
    const page = pageOf(z.string());
    expect(page.safeParse({ items: ["a"], total: 1, limit: 20, offset: 0 }).success).toBe(true);
  });

  it("accepts an empty summary and rejects a negative count", () => {
    const empty = { measurementSetCount: 0, latestSizeLabel: null, lastMeasurementAt: null };
    expect(clientSummarySchema.safeParse(empty).success).toBe(true);
    expect(clientSummarySchema.safeParse({ ...empty, measurementSetCount: -1 }).success).toBe(false);
  });
});
