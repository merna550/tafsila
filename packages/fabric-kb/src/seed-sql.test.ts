/** Checks that the fabrics migration still holds exactly the package's draft data (decision 317). */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DRAFT_CATALOGUE } from "./draft-catalogue";
import { DRAFT_RULES } from "./draft-rules";
import { fabricRulesInsertSql, fabricSeedSql, fabricsInsertSql } from "./seed-sql";

const MIGRATION = new URL("../../../supabase/migrations/20261028120000_fabrics.sql", import.meta.url);

describe("fabric seed SQL", () => {
  it("is exactly what the migration ends with", () => {
    expect(readFileSync(MIGRATION, "utf8").endsWith(`${fabricSeedSql()}\n`)).toBe(true);
  });

  it("has one row per draft fabric and per draft rule", () => {
    expect(DRAFT_CATALOGUE).toHaveLength(16);
    expect(DRAFT_RULES).toHaveLength(21);
    expect(fabricsInsertSql().match(/^ {2}\('/gm)).toHaveLength(DRAFT_CATALOGUE.length);
    expect(fabricRulesInsertSql().match(/^ {2}\('/gm)).toHaveLength(DRAFT_RULES.length);
  });

  it("marks rows as draft only while the data is a draft", () => {
    expect(fabricsInsertSql(DRAFT_CATALOGUE, false)).not.toContain(", true)");
  });

  it("doubles single quotes in text", () => {
    const [first] = DRAFT_CATALOGUE;
    expect(fabricsInsertSql([{ ...first!, nameEn: "It's" }])).toContain("'It''s'");
  });
});
