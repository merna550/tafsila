import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  adminAudit,
  clients,
  designs,
  fabricCalcs,
  fabricRules,
  fabrics,
  measurementSets,
  patternVersions,
  profiles,
  sizeCharts,
} from "./schema";

const TYPES = readFileSync(join(__dirname, "./database.types.ts"), "utf8");

/**
 * Reads the column names of a table's Row type from the generated Supabase types.
 *
 * @param table - Table name in the `public` schema.
 * @returns Column names in file order.
 */
function generatedColumns(table: string): string[] {
  const start = TYPES.indexOf(`${table}: {`);
  const row = TYPES.slice(start, TYPES.indexOf("Insert:", start));
  return row
    .split(/[;{\n]/)
    .map((part) => (part.split(":")[0] ?? "").trim().replace("?", ""))
    .filter((name) => /^[a-z_]+$/.test(name) && name !== "Row" && name !== table);
}

/**
 * Reads the SQL column names of a Drizzle table.
 *
 * @param table - Drizzle table.
 * @returns Column names.
 */
function drizzleColumns(table: PgTable): string[] {
  return Object.values(getTableColumns(table)).map((column) => column.name);
}

describe("Drizzle schema mirror", () => {
  it("has the same columns as the generated Supabase types (clients)", () => {
    expect(drizzleColumns(clients).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("clients").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (measurement_sets)", () => {
    expect(drizzleColumns(measurementSets).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("measurement_sets").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (size_charts)", () => {
    expect(drizzleColumns(sizeCharts).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("size_charts").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (admin_audit)", () => {
    expect(drizzleColumns(adminAudit).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("admin_audit").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (profiles)", () => {
    expect(drizzleColumns(profiles).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("profiles").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (designs)", () => {
    expect(drizzleColumns(designs).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("designs").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (pattern_versions)", () => {
    expect(drizzleColumns(patternVersions).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("pattern_versions").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (fabrics)", () => {
    expect(drizzleColumns(fabrics).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("fabrics").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (fabric_rules)", () => {
    expect(drizzleColumns(fabricRules).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("fabric_rules").sort((a, b) => a.localeCompare(b)),
    );
  });

  it("has the same columns as the generated Supabase types (fabric_calcs)", () => {
    expect(drizzleColumns(fabricCalcs).sort((a, b) => a.localeCompare(b))).toEqual(
      generatedColumns("fabric_calcs").sort((a, b) => a.localeCompare(b)),
    );
  });
});
