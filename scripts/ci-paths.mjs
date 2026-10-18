// Decides whether a CI job or a step of the quality job is needed for a change (issues #86, #188).
// Usage: node scripts/ci-paths.mjs <target|steps> <event_name> <base_ref> <before_sha> <sha>
//        node scripts/ci-paths.mjs --table | --write-table   (Markdown table for docs/WORKFLOW.md, checked by docs:check)
// A single target prints `run=true` or `run=false` for $GITHUB_OUTPUT. `steps` prints one `<target>=true|false`
// line for every `if`-gated step of the quality job and writes one line per skipped step to the job summary.
// A job or step that is skipped by its `if` still reports success, so a required check never blocks a merge.
// Anything unclear (tags, first push, git errors, the nightly run) runs everything.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Root files that change the install or the toolchain of every job. */
const ROOT = String.raw`(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig\.base\.json|\.nvmrc)`;
const SHARED = new RegExp(`^(${ROOT}|scripts/ci-paths\\.mjs)$`);
/** The quality workflow itself: a change to it re-runs all its gated steps. */
const QUALITY_YML = /^\.github\/workflows\/quality\.yml$/;
/** Tests, stories and snapshots never change what a static check sees (docs and tests are not shipped). */
const TESTS = [
  /\.stories\.[cm]?[jt]sx?$/,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /(^|\/)(__snapshots__|__tests__|e2e|test-results|\.storybook)\//,
];
/** Engine-only contracts of the schemas package: the web app and the API do not import them yet. */
const ENGINE_SCHEMAS = [
  /^packages\/schemas\/src\/(pattern|engine-options)[^/]*\.ts$/,
  /^packages\/schemas\/json\//,
];
/** Engine files that never reach the web image: scripts, fixtures, snapshots and drawings. */
const ENGINE_NOISE = [
  /^packages\/engine\/scripts\//,
  /^packages\/engine\/.*\.(snap|svg)$/,
  /^packages\/test-fixtures\//,
];
/** Config of the two source checks (duplicate code, architecture rules). */
const CODE_CONFIG = /^(\.jscpd\.json|\.dependency-cruiser\.cjs)$/;
const MARKDOWN = /\.mdx?$/;

/**
 * Per target: files that make it necessary (`include`), files that never do (`exclude`) and two short texts for
 * the table in docs/WORKFLOW.md. `where` says if it is a job or a step of the quality job.
 */
export const RULES = {
  storybook: {
    where: "job",
    runsFor: "`packages/ui/**`, `quality.yml`, root toolchain files",
    skipsFor: "everything else",
    include: [SHARED, /^packages\/ui\//, QUALITY_YML],
    exclude: [],
  },
  docker: {
    where: "job (`build`)",
    runsFor:
      "`apps/web/**`, `packages/**` (engine included: the web app imports it), `.dockerignore`, `.github/ci.env`, `docker.yml`",
    skipsFor:
      "tests, stories, snapshots, `*.md`, `packages/test-fixtures/`, `packages/engine/{scripts,**/*.snap,**/*.svg}`",
    include: [
      SHARED,
      /^(apps\/web|packages)\//,
      /^\.dockerignore$/,
      /^\.github\/ci\.env$/,
      /^\.github\/workflows\/docker\.yml$/,
    ],
    exclude: [...TESTS, MARKDOWN, ...ENGINE_NOISE],
  },
  // The web e2e runs the real app, so web, the packages it uses and the database migrations matter; its own specs
  // count too (unlike the docker job), unit tests, stories and docs do not (issue #90).
  e2e: {
    where: "job",
    runsFor: "`apps/web/**`, `packages/{ui,api,config,schemas,utils}/**`, `supabase/**`, `ci.env`, `e2e.yml`",
    skipsFor:
      "unit tests, stories, snapshots, `*.md`, engine-only schema files (`pattern*.ts`, `engine-options*.ts`, `json/`)",
    include: [
      SHARED,
      /^(apps\/web|packages\/(ui|api|config|schemas|utils))\//,
      /^supabase\//,
      /^\.github\/(ci\.env|workflows\/e2e\.yml)$/,
    ],
    exclude: [
      /\.stories\.[cm]?[jt]sx?$/,
      /\.test\.[cm]?[jt]sx?$/,
      /(^|\/)(__snapshots__|\.storybook)\//,
      MARKDOWN,
      ...ENGINE_SCHEMAS,
    ],
  },
  // The fresh-database proof (migrations, seed, pgTAP) only depends on the database files and the install (issue #83).
  supabase: {
    where: "job (`db-reset`)",
    runsFor: "`supabase/**`, the Supabase adapter of the API, `supabase.yml`",
    skipsFor: "everything else",
    include: [
      SHARED,
      /^supabase\//,
      /^packages\/api\/src\/adapters\/supabase\//,
      /^\.github\/workflows\/supabase\.yml$/,
    ],
    exclude: [MARKDOWN],
  },
  // The OpenAPI staleness check and the Newman run depend on the API routes, their schemas, the Postman files and the
  // scripts that generate or run them; they run as `if`-gated steps of the quality job (issue #94).
  api: {
    where: "quality step",
    runsFor: "`packages/{api,schemas,config}/**`, `postman/**`, the OpenAPI and Postman scripts",
    skipsFor: "tests, `*.md`, everything else",
    include: [
      SHARED,
      /^packages\/(api|schemas|config)\//,
      /^postman\//,
      /^scripts\/(gen-postman|api-check|api-test)\.mjs$/,
      QUALITY_YML,
    ],
    exclude: [/\.test\.[cm]?[jt]sx?$/, MARKDOWN],
  },
  // Duplicate code and architecture rules read source files only (issue #188).
  jscpd: {
    where: "quality step",
    runsFor:
      "source under `apps/**` or `packages/**`, `.jscpd.json`, `.jscpd.json`, `.dependency-cruiser.cjs`, `quality.yml`",
    skipsFor: "tests, stories, snapshots, `*.md`, `docs/**`, `scripts/**`",
    include: [SHARED, /^(apps|packages)\//, CODE_CONFIG, QUALITY_YML],
    exclude: [...TESTS, MARKDOWN],
  },
  depcruise: {
    where: "quality step",
    runsFor:
      "source under `apps/**` or `packages/**`, `.jscpd.json`, `.dependency-cruiser.cjs`, `quality.yml`",
    skipsFor: "tests, stories, snapshots, `*.md`, `docs/**`, `scripts/**`",
    include: [SHARED, /^(apps|packages)\//, CODE_CONFIG, QUALITY_YML],
    exclude: [...TESTS, MARKDOWN],
  },
  // The handbook guard reads docs, Markdown files and every package.json (dependency cards).
  docs: {
    where: "quality step",
    runsFor:
      "`docs/**`, `**/*.md`, any `package.json`, `scripts/{check-handbook,learning-log-index}.mjs`, `quality.yml`",
    skipsFor: "code-only changes",
    include: [
      SHARED,
      /^docs\//,
      MARKDOWN,
      /(^|\/)package\.json$/,
      /^scripts\/(check-handbook|learning-log-index)\.mjs$/,
      QUALITY_YML,
    ],
    exclude: [],
  },
  tokens: {
    where: "quality step",
    runsFor:
      "`packages/ui/**`, `docs/design-system/**`, `apps/web/src/**/*.css`, the token scripts, `quality.yml`",
    skipsFor: "everything else",
    include: [
      SHARED,
      /^packages\/ui\//,
      /^docs\/design-system\//,
      /^apps\/web\/src\/.*\.css$/,
      /^scripts\/(check-design-tokens|gen-tokens)\.mjs$/,
      QUALITY_YML,
    ],
    exclude: [],
  },
  // The tests of scripts/ read the workflow files, the docs and the handbook, so those count too.
  scripts: {
    where: "quality step",
    runsFor: "`scripts/**`, `.github/**`, `docs/handbook/**`, `docs/design-system/**`, `quality.yml`",
    skipsFor: "app and package code",
    include: [SHARED, /^scripts\//, /^\.github\//, /^docs\/(handbook|design-system)\//, QUALITY_YML],
    exclude: [],
  },
};

/** The targets that are `if`-gated steps of the quality job (the `steps` mode prints these). */
export const QUALITY_STEPS = Object.entries(RULES)
  .filter(([, rule]) => rule.where === "quality step")
  .map(([name]) => name);

/**
 * Tells whether a job is needed for a list of changed files.
 *
 * @param target Job or step name, a key of RULES.
 * @param files Changed file paths.
 * @returns True when at least one file can change what the job checks.
 */
export function needsJob(target, files) {
  const rule = RULES[target];
  if (!rule) throw new Error(`Unknown target: ${target}`);
  return files.some((f) => rule.include.some((re) => re.test(f)) && !rule.exclude.some((re) => re.test(f)));
}

/**
 * Applies the "unknown change = run" fallback on top of the rules.
 *
 * @param target Job or step name.
 * @param files Changed file paths, or null when the change cannot be known (tag, nightly, first push, git error).
 * @returns True when the job must run.
 */
export function shouldRun(target, files) {
  if (files === null) {
    if (!RULES[target]) throw new Error(`Unknown target: ${target}`);
    return true;
  }
  return needsJob(target, files);
}

/**
 * Renders the "which check runs for which paths" table for docs/WORKFLOW.md from the rule table.
 *
 * @returns Markdown table lines joined by newlines.
 */
export function ruleTable() {
  const rows = Object.entries(RULES).map(
    ([name, r]) => `| \`${name}\` | ${r.where} | ${r.runsFor} | ${r.skipsFor} |`,
  );
  return [
    "| Check | Kind | Runs when a changed file is | Skipped for |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** Markers around the generated table in docs/WORKFLOW.md. */
export const TABLE_START = "<!-- ci-table:start (generated by scripts/ci-paths.mjs --write-table) -->";
export const TABLE_END = "<!-- ci-table:end -->";

/**
 * Normalises a Markdown table so Prettier's column padding does not matter when comparing two tables.
 *
 * @param table Markdown table text.
 * @returns The cells of every row, trimmed, one row per line (separator rows dropped).
 */
export function normalizeTable(table) {
  return table
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !/^\|[\s|:-]+\|$/.test(line))
    .map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .join("|"),
    )
    .join("\n");
}

/**
 * Rewrites the generated table inside docs/WORKFLOW.md (run Prettier on the file afterwards).
 *
 * @param file Path of the Markdown file holding the two markers.
 */
function writeTable(file) {
  const text = readFileSync(file, "utf8");
  const start = text.indexOf(TABLE_START);
  const end = text.indexOf(TABLE_END);
  if (start === -1 || end === -1) throw new Error(`Markers not found in ${file}`);
  writeFileSync(file, `${text.slice(0, start + TABLE_START.length)}\n\n${ruleTable()}\n\n${text.slice(end)}`);
}

/**
 * Lists the files changed by the event.
 *
 * @param event GitHub event name.
 * @param baseRef Base branch of a pull request.
 * @param range For pushes: `[before, sha]`.
 * @returns File paths, or null when the change cannot be known (run everything).
 */
function changedFiles(event, baseRef, range) {
  const [before, sha] = range;
  let spec = null;
  if (event === "pull_request" && baseRef) spec = `origin/${baseRef}...HEAD`;
  else if (event === "push" && /^[0-9a-f]{40}$/.test(before) && !/^0+$/.test(before))
    spec = `${before}..${sha}`;
  if (!spec) return null;
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- git
    const out = execFileSync("git", ["diff", "--name-only", spec], { encoding: "utf8" });
    return out.split("\n").filter(Boolean);
  } catch {
    return null;
  }
}

/**
 * Prints one `<step>=true|false` line per gated quality step and lists the skipped ones in the job summary.
 *
 * @param files Changed files, or null when everything must run.
 */
function printSteps(files) {
  const skipped = [];
  for (const step of QUALITY_STEPS) {
    const run = shouldRun(step, files);
    console.log(`${step}=${run}`);
    if (!run) skipped.push(`- skipped \`${step}\`: no relevant changes`);
  }
  if (skipped.length && process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${skipped.join("\n")}\n`);
}

/**
 * Prints the decision for the target named on the command line (or the table).
 *
 * @returns Nothing; the result goes to stdout.
 */
function main() {
  const [target, event, baseRef, before, sha] = process.argv.slice(2);
  if (target === "--table") return console.log(ruleTable());
  if (target === "--write-table") return writeTable("docs/WORKFLOW.md");
  const isTag = process.env.GITHUB_REF?.startsWith("refs/tags/");
  const files = isTag ? null : changedFiles(event, baseRef, [before, sha]);
  if (target === "steps") return printSteps(files);
  console.log(`run=${shouldRun(target, files)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
