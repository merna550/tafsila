/**
 * The AI evaluation harness (issue #338): `pnpm ai:eval --provider <fake|anthropic|google> --model <id> --photos
 * <folder|url-list> [--labels <file>] [--out <dir>] [--only <ids>] [--hint] [--max-photos N] [--budget-usd X]`.
 * Writes `eval-runs/<time>-<provider>-<model>.json` and `.md` (git-ignored) and prints the markdown summary.
 * See docs/test-cases/ai/eval-run.md.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { boundAnalyze, defaultLabelsPath, parseEvalArgs, photoSource } from "../src/eval/cli";
import { parseLabels } from "../src/eval/labels";
import { toMarkdown } from "../src/eval/markdown";
import { buildReport } from "../src/eval/report";
import { runEval } from "../src/eval/run";

/** The repository root: photos inside it are refused, and relative paths resolve from it. */
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

/** `pnpm ai:eval` runs from packages/ai; paths given on the command line are relative to where it was typed. */
const cwd = process.env.INIT_CWD ?? repoRoot;

const args = parseEvalArgs(process.argv.slice(2), process.env);
const photos = args.photos === undefined ? undefined : resolve(cwd, args.photos);
const photoFor = await photoSource(photos, repoRoot);
const labelsPath = args.labels === undefined ? defaultLabelsPath(photos) : resolve(cwd, args.labels);
const labels = parseLabels(await readFile(labelsPath, "utf8")).filter(
  (label) => args.only === undefined || args.only.includes(label.id),
);

const startedAt = new Date().toISOString();
const deps = {
  analyze: boundAnalyze({ config: args.config }, args.price),
  photoFor,
};
const run = await runEval(labels, args.limits, deps);
const report = buildReport(run, args.limits, {
  startedAt,
  provider: args.config.provider,
  model: args.config.analyzeModel,
  usdEgp: args.usdEgp,
  chatAllowanceEgp: args.chatAllowanceEgp,
});

const out = resolve(cwd, args.out);
const name = `${startedAt.replace(/[:.]/g, "-")}-${args.config.provider}-${args.config.analyzeModel}`.replace(
  /[^\w.-]/g,
  "_",
);
await mkdir(out, { recursive: true });
const markdown = toMarkdown(report);
await writeFile(join(out, `${name}.json`), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(out, `${name}.md`), markdown);
process.stdout.write(`${markdown}\nSaved ${join(out, name)}.{json,md}\n`);
