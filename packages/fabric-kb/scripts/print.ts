/** Prints the draft recommendation for a test fixture design: `pnpm --filter @tafsila/fabric-kb print <fixture>`. */
import * as fixtures from "@tafsila/test-fixtures";
import { DRAFT_CATALOGUE, DRAFT_RULES, recommend } from "../src";

/**
 * Writes one line to standard output.
 *
 * @param line - The text.
 */
function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

const name = process.argv[2];
const spec = (fixtures as Record<string, unknown>)[name ?? ""];
if (!name || typeof spec !== "object" || spec === null || !("schemaVersion" in spec)) {
  console.error("Usage: pnpm --filter @tafsila/fabric-kb print <fixture name, e.g. puffSleeveBlouse>");
  process.exit(1);
}
const result = recommend(spec as Parameters<typeof recommend>[0], DRAFT_CATALOGUE, DRAFT_RULES);
out(`DRAFT recommendations for ${name}`);
for (const r of result.recommended) out(` + ${r.fabricId} (${r.score}): ${r.reason.ar} | ${r.reason.en}`);
for (const a of result.avoid) out(` - ${a.fabricId} [${a.ruleId}]: ${a.reason.ar} | ${a.reason.en}`);
