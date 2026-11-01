/**
 * Runs both AI calls once with the configured provider (fake by default, decision 337) and prints the results:
 * `pnpm --filter @tafsila/ai print [category] [chat message] [photo URL]`.
 */
import { loadAiConfig } from "@tafsila/config";
import type { GarmentCategory } from "@tafsila/schemas";
import { analyzeDesign, proposeEdit } from "../src";

/**
 * Writes one line to standard output.
 *
 * @param line - The text.
 */
function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

const category = (process.argv[2] ?? "dress") as GarmentCategory;
const message = process.argv[3] ?? "add side pockets";
const deps = { config: loadAiConfig() };
const photo = {
  url: process.argv[4] ?? "https://example.com/front.jpg",
  mediaType: "image/jpeg",
  view: "front" as const,
};

const analysis = await analyzeDesign({ photos: [photo], hint: { category } }, deps);
out(
  `analyzeDesign (${analysis.usage.provider}/${analysis.usage.model}, ${analysis.usage.attempts} attempt(s))`,
);
out(JSON.stringify(analysis.result, null, 2));
const edit = await proposeEdit({ spec: analysis.result.spec, message }, deps);
out(`proposeEdit "${message}"`);
out(JSON.stringify({ patch: edit.patch, outcome: edit.outcome, usage: edit.usage }, null, 2));
