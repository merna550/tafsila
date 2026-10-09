// Agent usage metrics (issue #36): turns one agent run into one numbers-only record, stores it as a JSON line
// on the `metrics` branch and prints the one-line issue comment / the PR "Agent usage" block.
// Pure functions (parse -> record) are unit-tested in agent-usage.test.mjs. Records never hold prompts, code or
// file contents: `toRecord` copies a fixed list of fields only.
//
// Input formats (verify when the pinned action version changes, `anthropics/claude-code-action@v1`):
// - Action execution file (`execution_file` output): JSON array of messages; the last `type: "result"` message has
//   `num_turns`, `duration_ms`, `total_cost_usd`, `subtype`, `is_error` and `usage` with `input_tokens`,
//   `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`.
// - Session transcript (Stop hook `transcript_path`): JSONL; each `type: "assistant"` line has `message.id`,
//   `message.model` and `message.usage` (same token fields). Lines repeat per content block, so ids are deduped.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const RECORD_FIELDS = [
  "run_id",
  "issue",
  "pr",
  "source",
  "model",
  "size",
  "areas",
  "type",
  "started_at",
  "duration_s",
  "num_turns",
  "input_tokens",
  "output_tokens",
  "cache_read_tokens",
  "cache_write_tokens",
  "cache_hit_ratio",
  "est_cost_usd",
  "outcome",
  "git_sha",
];
export const USAGE_FILE = ".agent-usage.json";
export const METRICS_BRANCH = "metrics";
export const METRICS_FILE = "agent-runs.jsonl";

// API-equivalent USD per million tokens: [input, output, cache read, cache write]. Estimate for comparison only.
const PRICES = {
  opus: [15, 75, 1.5, 18.75],
  sonnet: [3, 15, 0.3, 3.75],
  haiku: [1, 5, 0.1, 1.25],
};

/**
 * Turns any value into a non-negative finite number.
 *
 * @param value Candidate number.
 * @returns The number, or 0 when missing or invalid.
 */
const num = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0);

/**
 * Adds Anthropic usage fields into the token counters of a record.
 *
 * @param tokens Running totals.
 * @param usage A `usage` object (may be undefined).
 * @returns The same totals object.
 */
function addUsage(tokens, usage = {}) {
  tokens.input_tokens += num(usage?.input_tokens);
  tokens.output_tokens += num(usage?.output_tokens);
  tokens.cache_read_tokens += num(usage?.cache_read_input_tokens);
  tokens.cache_write_tokens += num(usage?.cache_creation_input_tokens);
  return tokens;
}

/**
 * Starts an empty token counter.
 *
 * @returns Token totals at zero.
 */
const emptyTokens = () => ({
  input_tokens: 0,
  output_tokens: 0,
  cache_read_tokens: 0,
  cache_write_tokens: 0,
});

/**
 * Parses text that may be invalid JSON.
 *
 * @param text JSON text.
 * @param fallback Value returned when parsing fails.
 * @returns The parsed value or the fallback.
 */
function safeParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/**
 * Splits execution-file text into message objects (JSON array, or JSON Lines as a fallback).
 *
 * @param text Content of the execution file.
 * @returns Messages (may contain nulls for broken lines).
 */
function executionMessages(text) {
  const whole = safeParse(text, null);
  if (Array.isArray(whole)) return whole;
  return String(text ?? "")
    .split("\n")
    .map((line) => safeParse(line, null));
}

/**
 * Reads the final `result` message of a claude-code-action execution file.
 *
 * @param text Content of the execution file (JSON array, or JSON Lines).
 * @returns Partial record (tokens, turns, duration, cost, status). Missing fields are 0; never throws.
 */
export function parseExecution(text) {
  const messages = executionMessages(text);
  const result = messages.findLast((m) => m?.type === "result") ?? {};
  const named = messages.find((m) => m?.model ?? m?.message?.model);
  return {
    ...addUsage(emptyTokens(), result.usage),
    num_turns: num(result.num_turns),
    duration_s: Math.round(num(result.duration_ms) / 1000),
    model: named?.model ?? named?.message?.model ?? "",
    status: result.is_error ? "failed" : (result.subtype ?? ""),
  };
}

/**
 * Parses transcript text into entry objects, skipping broken lines.
 *
 * @param text Transcript content (JSON Lines).
 * @returns Entries.
 */
function transcriptEntries(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => safeParse(line, null))
    .filter((entry) => entry && typeof entry === "object");
}

/**
 * Keeps one assistant entry per message id (the transcript repeats a message once per content block).
 *
 * @param entries Transcript entries.
 * @returns Assistant messages that carry usage, deduplicated.
 */
function assistantMessages(entries) {
  const byId = new Map();
  for (const entry of entries) {
    const message = entry.message;
    if (entry.type === "assistant" && message?.usage) byId.set(message.id ?? byId.size, message);
  }
  return [...byId.values()];
}

/**
 * Sums the usage of a session transcript (JSON Lines).
 *
 * @param text Transcript content.
 * @returns Partial record: tokens, assistant turns, duration between first and last line, started_at, model.
 */
export function parseTranscript(text) {
  const entries = transcriptEntries(text);
  const messages = assistantMessages(entries);
  const times = entries.map((e) => Date.parse(e.timestamp)).filter(Number.isFinite);
  const tokens = messages.reduce((sum, m) => addUsage(sum, m.usage), emptyTokens());
  return {
    ...tokens,
    num_turns: messages.length,
    duration_s: times.length ? Math.round((Math.max(...times) - Math.min(...times)) / 1000) : 0,
    started_at: times.length ? new Date(Math.min(...times)).toISOString() : "",
    model: messages.at(-1)?.model ?? "",
    status: "",
  };
}

/**
 * Maps a model id or alias to a price family.
 *
 * @param model Model alias ("sonnet") or id ("claude-sonnet-5-5").
 * @returns `opus`, `sonnet` or `haiku`; sonnet when unknown.
 */
export function modelFamily(model) {
  const name = String(model ?? "").toLowerCase();
  return Object.keys(PRICES).find((family) => name.includes(family)) ?? "sonnet";
}

/**
 * Estimates the API-equivalent cost of the tokens (Merna is on a subscription: comparison only).
 *
 * @param model Model alias or id.
 * @param tokens Token totals.
 * @returns Cost in USD rounded to cents.
 */
export function estimateCost(model, tokens) {
  const [input, output, read, write] = PRICES[modelFamily(model)];
  const cost =
    (tokens.input_tokens * input +
      tokens.output_tokens * output +
      tokens.cache_read_tokens * read +
      tokens.cache_write_tokens * write) /
    1e6;
  return Math.round(cost * 100) / 100;
}

/**
 * Share of input-side tokens served from the prompt cache.
 *
 * @param tokens Token totals.
 * @returns Ratio from 0 to 1 (0 when there were no input tokens).
 */
export function cacheHitRatio(tokens) {
  const total = tokens.input_tokens + tokens.cache_read_tokens + tokens.cache_write_tokens;
  return total ? Math.round((tokens.cache_read_tokens / total) * 100) / 100 : 0;
}

/**
 * Splits `size:M`, `area:api`, `type:feature` labels into the record fields.
 *
 * @param labels Label names.
 * @returns `{ size, areas, type }`.
 */
export function fromLabels(labels = []) {
  const value = (prefix) => labels.find((l) => l.startsWith(prefix))?.slice(prefix.length) ?? "";
  return {
    size: value("size:"),
    type: value("type:"),
    areas: labels.filter((l) => l.startsWith("area:")).map((l) => l.slice(5)),
  };
}

/**
 * Decides how the run ended.
 *
 * @param partial Parsed usage (`status`).
 * @param context `{ pr, labels }`.
 * @returns `pr_opened`, `blocked`, `failed` or `timeout`.
 */
export function outcomeOf(partial, { pr, labels = [] }) {
  if (labels.includes("status:blocked")) return "blocked";
  if (partial.status === "error_max_turns" || partial.status === "timeout") return "timeout";
  if (partial.status === "failed" || String(partial.status).startsWith("error")) return "failed";
  return pr ? "pr_opened" : "failed";
}

/**
 * Builds the stored record. Copies a fixed list of fields only, so nothing else can leak into it.
 *
 * @param partial Result of `parseExecution` or `parseTranscript`.
 * @param context `{ runId, issue, pr, source, model, labels, gitSha, startedAt }`.
 * @returns The record (see RECORD_FIELDS).
 */
export function toRecord(partial, context = {}) {
  const model = modelFamily(context.model || partial.model);
  const record = {
    ...identityFields(context),
    model,
    started_at: context.startedAt || partial.started_at || new Date().toISOString(),
    ...usageFields(partial),
    cache_hit_ratio: cacheHitRatio(partial),
    est_cost_usd: estimateCost(model, partial),
    outcome: context.outcome ?? outcomeOf(partial, context),
  };
  return Object.fromEntries(RECORD_FIELDS.map((field) => [field, record[field]]));
}

/**
 * Picks the identifying fields of a run from the context.
 *
 * @param context Run context.
 * @returns Run id, issue, PR, source, labels-derived fields and git sha.
 */
function identityFields(context) {
  return {
    run_id: String(context.runId ?? ""),
    issue: Number(context.issue) || null,
    pr: Number(context.pr) || null,
    source: context.source ?? "local",
    ...fromLabels(context.labels),
    git_sha: context.gitSha ?? "",
  };
}

/**
 * Picks the numeric usage fields of a partial record, defaulting each to 0.
 *
 * @param partial Result of a parser.
 * @returns Duration, turns and token counters.
 */
function usageFields(partial) {
  const fields = [
    "duration_s",
    "num_turns",
    "input_tokens",
    "output_tokens",
    "cache_read_tokens",
    "cache_write_tokens",
  ];
  return Object.fromEntries(fields.map((field) => [field, num(partial[field])]));
}

/**
 * Total tokens of a record.
 *
 * @param record A run record.
 * @returns Sum of input, output and cache tokens.
 */
export const totalTokens = (record) =>
  record.input_tokens + record.output_tokens + record.cache_read_tokens + record.cache_write_tokens;

/**
 * Formats one record as the one-line issue comment.
 *
 * @param record A run record.
 * @returns For example "Run · sonnet · 42 turns · 1.8M tokens (78% cache) · ~$2.10 est. · 23 min · PR #41".
 */
export function summaryLine(record) {
  const tokens = totalTokens(record);
  const size = tokens >= 1e6 ? `${(tokens / 1e6).toFixed(1)}M` : `${Math.round(tokens / 1e3)}k`;
  const parts = [
    "Run",
    record.model,
    `${record.num_turns} turns`,
    `${size} tokens (${Math.round(record.cache_hit_ratio * 100)}% cache)`,
    `~$${record.est_cost_usd.toFixed(2)} est.`,
    `${Math.max(1, Math.round(record.duration_s / 60))} min`,
    record.pr ? `PR #${record.pr}` : record.outcome,
  ];
  return `🤖 ${parts.join(" · ")}`;
}

/**
 * Formats the collapsed "Agent usage" block for a PR body.
 *
 * @param record A run record.
 * @returns Markdown `<details>` block.
 */
export function prBlock(record) {
  return `<details><summary>Agent usage</summary>\n\n${summaryLine(record)}\n\n\`\`\`json\n${JSON.stringify(record)}\n\`\`\`\n\n</details>`;
}

/**
 * Appends a record to the metrics branch with a retry on push conflicts. Uses git plumbing (blob, tree, commit)
 * so the working tree and the current branch are never touched, and the checkout's credentials are reused.
 *
 * @param line JSON line to append.
 * @param git Function `(args, input?) => string` that runs git in the repo; injectable for tests.
 * @param attempts Maximum tries (each one re-fetches the branch).
 * @throws {Error} When every attempt was rejected.
 */
export function appendToMetrics(line, git, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { parent, content } = readMetrics(git);
    const blob = git(["hash-object", "-w", "--stdin"], `${content}${line}\n`).trim();
    const tree = git(["mktree"], `100644 blob ${blob}\t${METRICS_FILE}\n`).trim();
    const message = ["-m", "chore(metrics): add agent run"];
    const commit = git(["commit-tree", tree, ...(parent ? ["-p", parent] : []), ...message]).trim();
    try {
      git(["push", "-q", "origin", `${commit}:refs/heads/${METRICS_BRANCH}`]);
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
    }
  }
}

/**
 * Fetches the metrics branch and reads the current file.
 *
 * @param git Git runner `(args, input?) => string`.
 * @returns `{ parent, content }`; both empty when the branch does not exist yet.
 */
function readMetrics(git) {
  try {
    git(["fetch", "-q", "origin", METRICS_BRANCH]);
    const parent = git(["rev-parse", "FETCH_HEAD"]).trim();
    return { parent, content: git(["show", `${parent}:${METRICS_FILE}`]) };
  } catch {
    return { parent: "", content: "" };
  }
}

/**
 * Reads `--name value` pairs from argv.
 *
 * @param argv Arguments after the sub-command.
 * @returns Map of option name to value.
 */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) out[argv[i].replace(/^--/, "")] = argv[i + 1];
  return out;
}

/**
 * Reads the record input file named by the options.
 *
 * @param opts Options from `parseArgs`.
 * @returns `{ partial, execution }`, or null when the file is missing.
 */
function readInput(opts) {
  const path = opts.execution ?? opts.transcript;
  if (!path || !existsSync(path)) return null;
  const text = readFileSync(path, "utf8");
  return opts.execution ? parseExecution(text) : parseTranscript(text);
}

/**
 * Builds a record from CLI options.
 *
 * @param opts Options from `parseArgs`.
 * @returns The record, or null when the input file is missing.
 */
function recordFromOptions(opts) {
  const partial = readInput(opts);
  if (!partial) return null;
  return toRecord(partial, {
    runId: opts["run-id"] ?? process.env.GITHUB_RUN_ID ?? opts.transcript,
    issue: opts.issue,
    pr: opts.pr,
    source: opts.source ?? (opts.execution ? "action" : "local"),
    model: opts.model,
    labels: (opts.labels ?? "").split(",").filter(Boolean),
    gitSha: opts.sha,
  });
}

/**
 * Runs git with optional stdin.
 *
 * @param args Git arguments.
 * @param input Text for stdin.
 * @returns Standard output.
 */
// eslint-disable-next-line sonarjs/no-os-command-from-path -- `git` is preinstalled on runners and developer machines
const runGit = (args, input) => execFileSync("git", args, { input, encoding: "utf8", stdio: "pipe" });

/**
 * Prints the issue-comment line or the PR block of a stored record.
 *
 * @param command `line` or `block`.
 * @param opts Options (`file`).
 */
function printSummary(command, opts) {
  const record = safeParse(readFileSync(opts.file ?? USAGE_FILE, "utf8"), null);
  if (record) console.log((command === "line" ? summaryLine : prBlock)(record));
}

/**
 * Builds a record and prints it, or writes `.agent-usage.json` for `local`.
 *
 * @param command `record` or `local`.
 * @param opts Options; for `local` the transcript path may come from the hook's stdin.
 */
function emitRecord(command, opts) {
  if (command === "local" && !opts.transcript) {
    opts.transcript = safeParse(readFileSync(0, "utf8"), {}).transcript_path;
  }
  const record = recordFromOptions(opts);
  if (!record) console.warn("agent-usage: no usage file available; skipped.");
  else if (command === "local") writeFileSync(USAGE_FILE, JSON.stringify(record, null, 2));
  else console.log(JSON.stringify(record));
}

/**
 * CLI. Never fails a hook or a workflow: problems print a warning and exit 0.
 *
 * - `record --execution FILE|--transcript FILE [--issue N --pr N --model M --labels a,b --source S]` prints JSON.
 * - `local --transcript FILE ...` writes `.agent-usage.json` (Stop hook; the path may come from stdin).
 * - `line` / `block` print the comment line / PR block from `.agent-usage.json` or `--file`.
 * - `append --file RECORD.json` pushes the record to the metrics branch.
 */
function main() {
  const [command, ...rest] = process.argv.slice(2);
  const opts = parseArgs(rest);
  const commands = {
    line: () => printSummary(command, opts),
    block: () => printSummary(command, opts),
    append: () => appendToMetrics(JSON.stringify(safeParse(readFileSync(opts.file, "utf8"), null)), runGit),
  };
  try {
    (commands[command] ?? (() => emitRecord(command, opts)))();
  } catch (error) {
    console.warn(`agent-usage: ${error.message}; skipped.`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
