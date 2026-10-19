import { describe, expect, it } from "vitest";
import {
  createDesignInputSchema,
  designDetailSchema,
  listDesignsQuerySchema,
  updateDesignInputSchema,
} from "./designs";

describe("design schemas", () => {
  it("accepts a category with or without a title and rejects an unknown category", () => {
    expect(createDesignInputSchema.safeParse({ category: "dress" }).success).toBe(true);
    expect(createDesignInputSchema.parse({ category: "skirt", title: "  تنورة  " }).title).toBe("تنورة");
    expect(createDesignInputSchema.safeParse({ category: "coat" }).success).toBe(false);
  });

  it("limits the title to 1-120 characters after trimming", () => {
    expect(updateDesignInputSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(updateDesignInputSchema.safeParse({ title: "x".repeat(120) }).success).toBe(true);
    expect(updateDesignInputSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
  });

  it("applies paging defaults and validates the client filter", () => {
    expect(listDesignsQuerySchema.parse({})).toEqual({ limit: 20, offset: 0 });
    expect(listDesignsQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(listDesignsQuerySchema.safeParse({ clientId: "x" }).success).toBe(false);
  });

  it("allows a design without a current version", () => {
    const design = {
      id: "00000000-0000-4000-8000-0000000000d1",
      category: "dress",
      title: "T",
      currentVersionId: null,
      createdAt: "2026-10-19T10:00:00.000Z",
      updatedAt: "2026-10-19T10:00:00.000Z",
    };
    expect(designDetailSchema.safeParse({ design, currentVersion: null }).success).toBe(true);
  });
});
