// Model selection for /build, /plan and claude.yml (issue #40): maps an issue's build:* / plan:* label to a
// Claude model alias and the subagent that runs it. The pure functions are unit-tested in agent-model.test.mjs.
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_MODEL = "sonnet";
const STEPS = {
  build: { agent: "builder", models: ["haiku", "sonnet", "opus"] },
  plan: { agent: "planner", models: ["sonnet", "opus"] },
};

/**
 * Resolves the model and subagent for a step from the issue labels.
 *
 * @param step "build" or "plan".
 * @param labels Label names of the issue.
 * @returns `{ model, agent, note }`: `agent` is null for `plan:none`; `note` explains a fallback or a skip.
 */
export function resolveModel(step, labels) {
  const { agent, models } = STEPS[step];
  const label = labels.find((l) => l.startsWith(`${step}:`));
  const value = label?.slice(step.length + 1);
  if (step === "plan" && value === "none") {
    return { model: "none", agent: null, note: "plan:none: this issue needs no plan." };
  }
  if (models.includes(value)) return { model: value, agent: `${agent}-${value}`, note: "" };
  const why = label ? `Unknown label ${label}` : `No ${step}:* label on the issue`;
  return {
    model: DEFAULT_MODEL,
    agent: `${agent}-${DEFAULT_MODEL}`,
    note: `${why}; using ${DEFAULT_MODEL}.`,
  };
}

/**
 * Finds the issue a pull request works on.
 *
 * @param pr Pull request as `{ body, closingIssuesReferences }` (from `gh pr view --json`).
 * @returns The first closing issue, else the first `Closes|Fixes|Resolves #N` in the body, else null.
 */
export function linkedIssue(pr) {
  const closing = pr.closingIssuesReferences?.[0]?.number;
  if (closing) return closing;
  const match = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i.exec(String(pr.body ?? ""));
  return match ? Number(match[1]) : null;
}

/**
 * Reads the command-line arguments.
 *
 * @param argv Arguments after the script path.
 * @returns `{ step, number, isPr, override }`.
 */
export function parseArgs(argv) {
  const args = [...argv];
  const isPr = args.includes("--pr");
  if (isPr) args.splice(args.indexOf("--pr"), 1);
  const at = args.indexOf("--model");
  const override = at < 0 ? undefined : args.splice(at, 2)[1];
  const [step = "build", number = ""] = args;
  if (!STEPS[step]) throw new Error(`Unknown step "${step}" (use build or plan).`);
  return { step, number, isPr, override };
}

/**
 * Runs `gh` and parses its JSON output.
 *
 * @param args Arguments for `gh`.
 * @returns Parsed JSON.
 */
// eslint-disable-next-line sonarjs/no-os-command-from-path -- `gh` is the GitHub CLI preinstalled on Actions runners
const gh = (args) => JSON.parse(execFileSync("gh", args, { encoding: "utf8" }));

/**
 * Resolves the issue, model and subagent, prints them as JSON and writes GitHub Actions outputs.
 *
 * Usage: `node scripts/agent-model.mjs <build|plan> <issue>` or `... build --pr <pr>`; `--model <alias>`
 * overrides the label when it is a valid alias (the dispatcher passes the model it already resolved).
 */
function main() {
  const { step, number, isPr, override } = parseArgs(process.argv.slice(2));
  let issue = number ? Number(number) : null;
  let labels = [];
  try {
    if (isPr && issue)
      issue = linkedIssue(gh(["pr", "view", String(issue), "--json", "body,closingIssuesReferences"]));
    if (issue) labels = gh(["issue", "view", String(issue), "--json", "labels"]).labels.map((l) => l.name);
  } catch (error) {
    console.error(`Could not read labels: ${error.message}`);
  }
  const result = { issue, ...resolveModel(step, labels) };
  if (STEPS[step].models.includes(override))
    Object.assign(result, resolveModel(step, [`${step}:${override}`]));
  console.log(JSON.stringify(result));
  if (process.env.GITHUB_OUTPUT) {
    const lines = Object.entries(result).map(([k, v]) => `${k}=${v ?? ""}`);
    appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
