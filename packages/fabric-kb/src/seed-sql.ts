/** Builds the SQL that seeds the fabric catalogue and rules from the reviewed draft data, so the migration and the package never drift (decision 317). */
import { DRAFT_CATALOGUE } from "./draft-catalogue";
import { DRAFT_RULES } from "./draft-rules";
import { DRAFT } from "./draft-status";
import type { Fabric, FabricRule } from "@tafsila/schemas";

/**
 * Renders a text value as a SQL string literal.
 *
 * @param text - Any text.
 * @returns A single-quoted literal with quotes doubled.
 */
function textLiteral(text: string): string {
  return `'${text.replaceAll("'", "''")}'`;
}

/**
 * Renders a value as a JSON SQL literal.
 *
 * @param value - Any JSON value.
 * @returns A single-quoted literal with a `::jsonb` cast.
 */
function jsonLiteral(value: unknown): string {
  return `${textLiteral(JSON.stringify(value))}::jsonb`;
}

/**
 * Renders the insert statement of the fabrics, one row per line.
 *
 * @param fabrics - Catalogue to insert.
 * @param isDraft - Whether the rows are marked as draft.
 * @returns One SQL statement.
 */
export function fabricsInsertSql(fabrics: readonly Fabric[] = DRAFT_CATALOGUE, isDraft = DRAFT): string {
  const rows = fabrics.map(
    (f) =>
      `  (${[textLiteral(f.id), textLiteral(f.nameAr), textLiteral(f.nameEn), jsonLiteral(f.properties), jsonLiteral(f.careNotes), String(isDraft)].join(", ")})`,
  );
  return [
    "insert into public.fabrics (id, name_ar, name_en, properties, care_notes, is_draft)",
    "values",
    `${rows.join(",\n")}`,
    "on conflict (id) do nothing;",
  ].join("\n");
}

/**
 * Renders the insert statement of the rules, one row per line.
 *
 * @param rules - Rules to insert.
 * @param isDraft - Whether the rows are marked as draft.
 * @returns One SQL statement.
 */
export function fabricRulesInsertSql(rules: readonly FabricRule[] = DRAFT_RULES, isDraft = DRAFT): string {
  const rows = rules.map(
    (r) =>
      `  (${[textLiteral(r.id), jsonLiteral(r.when), jsonLiteral(r.effect), String(r.priority), jsonLiteral(r.reason), String(isDraft)].join(", ")})`,
  );
  return [
    "insert into public.fabric_rules (id, condition, required_properties, priority, reason, is_draft)",
    "values",
    `${rows.join(",\n")}`,
    "on conflict (id) do nothing;",
  ].join("\n");
}

/**
 * Renders the whole seed: fabrics first, then rules.
 *
 * @returns The two statements separated by a blank line.
 */
export function fabricSeedSql(): string {
  return `${fabricsInsertSql()}\n\n${fabricRulesInsertSql()}`;
}
