// Removes the custom auth email template blocks from a Supabase config.toml before `supabase config push` to staging
// (issue #107): Supabase Free refuses template changes without a custom SMTP provider, and paying is out (ADR-022).
// Only the CI runner's copy is changed; the committed file keeps the Arabic templates for local dev.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Header of a TOML table whose block is removed, e.g. `[auth.email.template.confirmation]`. */
const TEMPLATE_HEADER = /^\s*\[auth\.email\.template\.[^\]]+\]\s*$/;

/** Any TOML table or array-of-tables header; it ends the block being removed. */
const ANY_HEADER = /^\s*\[\[?[^\]]+\]\]?\s*$/;

/**
 * Returns the config text without the `[auth.email.template.*]` tables; every other line is kept as is.
 * A removed block runs from its header to the next header, so trailing comments before the next table go with it.
 *
 * @param {string} toml Contents of supabase/config.toml.
 * @returns {string} The same text without the template tables.
 */
export function stripEmailTemplates(toml) {
  const kept = [];
  let skipping = false;
  for (const line of toml.split("\n")) {
    if (ANY_HEADER.test(line)) skipping = TEMPLATE_HEADER.test(line);
    if (!skipping) kept.push(line);
  }
  return kept.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2] ?? "supabase/config.toml";
  writeFileSync(file, stripEmailTemplates(readFileSync(file, "utf8")));
  console.log(`Removed [auth.email.template.*] tables from ${file}`);
}
