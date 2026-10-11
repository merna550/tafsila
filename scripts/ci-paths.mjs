// Decides whether an expensive CI job is needed for a change (issue #86).
// Usage: node scripts/ci-paths.mjs <storybook|docker|e2e|api|supabase> <event_name> <base_ref> <before_sha> <sha>
// Prints `run=true` or `run=false` for $GITHUB_OUTPUT. A job that is skipped by its `if` still reports success,
// so a required check never blocks a merge. Anything unclear (tags, first push, git errors) runs the job.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Root files that change the install or the toolchain of every job. */
const ROOT = String.raw`(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig\.base\.json|\.nvmrc)`;
const SHARED = new RegExp(`^(${ROOT}|scripts/ci-paths\\.mjs)$`);

/** Per job: files that make it necessary, and files that never do. */
const RULES = {
  storybook: {
    include: [SHARED, /^packages\/ui\//, /^\.github\/workflows\/quality\.yml$/],
    exclude: [],
  },
  docker: {
    include: [
      SHARED,
      /^(apps\/web|packages)\//,
      /^\.dockerignore$/,
      /^\.github\/ci\.env$/,
      /^\.github\/workflows\/docker\.yml$/,
    ],
    exclude: [
      /\.stories\.[cm]?[jt]sx?$/,
      /\.(test|spec)\.[cm]?[jt]sx?$/,
      /(^|\/)(__snapshots__|__tests__|e2e|test-results|\.storybook)\//,
      /\.mdx?$/,
    ],
  },
  // The web e2e runs the real app, so web, the packages it uses and the database migrations matter; its own specs
  // count too (unlike the docker job), unit tests, stories and docs do not (issue #90).
  e2e: {
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
      /\.mdx?$/,
    ],
  },
  // The fresh-database proof (migrations, seed, pgTAP) only depends on the database files and the install (issue #83).
  supabase: {
    include: [SHARED, /^supabase\//, /^\.github\/workflows\/supabase\.yml$/],
    exclude: [/\.mdx?$/],
  },
  // The OpenAPI staleness check and the Newman run depend on the API routes, their schemas, the Postman files and the
  // scripts that generate or run them; they run as `if`-gated steps of the quality job (issue #94).
  api: {
    include: [
      SHARED,
      /^packages\/(api|schemas|config)\//,
      /^postman\//,
      /^scripts\/(gen-postman|api-check|api-test)\.mjs$/,
      /^\.github\/workflows\/quality\.yml$/,
    ],
    exclude: [/\.test\.[cm]?[jt]sx?$/, /\.mdx?$/],
  },
};

/**
 * Tells whether a job is needed for a list of changed files.
 *
 * @param target Job name: "storybook", "docker", "e2e", "api" or "supabase".
 * @param files Changed file paths.
 * @returns True when at least one file can change what the job checks.
 */
export function needsJob(target, files) {
  const rule = RULES[target];
  if (!rule) throw new Error(`Unknown target: ${target}`);
  return files.some((f) => rule.include.some((re) => re.test(f)) && !rule.exclude.some((re) => re.test(f)));
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
 * Prints `run=true|false` for the job named on the command line.
 */
function main() {
  const [target, event, baseRef, before, sha] = process.argv.slice(2);
  const files = changedFiles(event, baseRef, [before, sha]);
  const isTag = process.env.GITHUB_REF?.startsWith("refs/tags/");
  console.log(`run=${isTag || files === null || needsJob(target, files)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
