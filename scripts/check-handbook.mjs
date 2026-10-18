/* eslint-disable sonarjs/super-linear-regex -- the regexes only scan our own Markdown files, never untrusted input */
// Handbook guard (issue #10): every direct dependency has a technology card,
// every relative link (and anchor) in docs/ resolves, and no two ADRs share a number (issue #76).
// Run: pnpm docs:check   (part of pnpm quality and the Code quality workflow)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { TABLE_END, TABLE_START, normalizeTable, ruleTable } from "./ci-paths.mjs";
import { checkLearningLogIndex } from "./learning-log-index.mjs";

const CARD_DIR = "docs/handbook/tech";
const NON_CARDS = new Set(["README.md", "_TEMPLATE.md"]);
const IGNORED_DEPS = [/^@tafsila\//, /^@types\//];
const WORKSPACE_GLOBS = ["apps", "packages"];

/**
 * Lists every file under a directory (recursively) whose name ends with the suffix.
 *
 * @param {string} dir Directory to walk.
 * @param {string} suffix File name suffix, for example ".md".
 * @returns {string[]} Absolute file paths, sorted.
 */
function listFiles(dir, suffix) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...listFiles(full, suffix));
    else if (name.endsWith(suffix)) found.push(full);
  }
  return found.sort();
}

/**
 * Reads the YAML front matter of a Markdown file as a real YAML document.
 *
 * @param {string} text Full Markdown text.
 * @returns {Record<string, unknown> | null} Parsed front matter, or null when absent.
 */
export function parseFrontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return null;
  const data = parseYaml(match[1]);
  return data && typeof data === "object" ? data : null;
}

/**
 * Collects the package names covered by all technology cards.
 *
 * @param {string} root Repo root.
 * @returns {{ covered: Set<string>, errors: string[] }} Covered names plus front matter problems.
 */
export function collectCardPackages(root) {
  const covered = new Set();
  const errors = [];
  const dir = join(root, CARD_DIR);
  for (const file of listFiles(dir, ".md")) {
    if (NON_CARDS.has(file.slice(dir.length + 1))) continue;
    const shown = relative(root, file);
    let data;
    try {
      data = parseFrontMatter(readFileSync(file, "utf8"));
    } catch (error) {
      errors.push(`${shown}: front matter is not valid YAML (${error.message})`);
      continue;
    }
    if (!data || !Array.isArray(data.packages)) {
      errors.push(`${shown}: front matter needs a "packages:" list (use [] when none)`);
      continue;
    }
    for (const name of data.packages) covered.add(String(name));
  }
  return { covered, errors };
}

/**
 * Finds every workspace package.json (root, apps/*, packages/*).
 *
 * @param {string} root Repo root.
 * @returns {string[]} Absolute paths of package.json files that exist.
 */
function workspaceManifests(root) {
  const manifests = [join(root, "package.json")];
  for (const group of WORKSPACE_GLOBS) {
    const groupDir = join(root, group);
    if (!existsSync(groupDir)) continue;
    for (const name of readdirSync(groupDir)) manifests.push(join(groupDir, name, "package.json"));
  }
  return manifests.filter((file) => existsSync(file));
}

/**
 * Lists direct dependencies (dependencies + devDependencies) of all workspace packages.
 *
 * @param {string} root Repo root.
 * @returns {Map<string, string>} Dependency name to the first manifest that declares it.
 */
export function collectDependencies(root) {
  const deps = new Map();
  for (const file of workspaceManifests(root)) {
    const json = JSON.parse(readFileSync(file, "utf8"));
    for (const name of Object.keys({ ...json.dependencies, ...json.devDependencies })) {
      if (IGNORED_DEPS.some((rule) => rule.test(name)) || deps.has(name)) continue;
      deps.set(name, relative(root, file));
    }
  }
  return deps;
}

/**
 * Reports every direct dependency that no technology card lists in `packages:`.
 *
 * @param {string} root Repo root.
 * @returns {string[]} Error messages naming the missing card.
 */
export function checkDependencyCards(root) {
  const { covered, errors } = collectCardPackages(root);
  for (const [name, manifest] of collectDependencies(root)) {
    if (!covered.has(name)) {
      errors.push(
        `Missing tech card: "${name}" (in ${manifest}) is not in any card's "packages:" front matter. ` +
          `Add it to a card in ${CARD_DIR}/ (copy _TEMPLATE.md for a new one).`,
      );
    }
  }
  return errors;
}

/**
 * Removes fenced code blocks so example text is not checked.
 *
 * @param {string} text Markdown text.
 * @returns {string} Text without fenced code.
 */
function stripFences(text) {
  return text.replace(/^(```|~~~)[\s\S]*?^\1/gm, "");
}

/**
 * Removes fenced code blocks and inline code so example links are not checked.
 *
 * @param {string} text Markdown text.
 * @returns {string} Text without code.
 */
function stripCode(text) {
  return stripFences(text).replace(/`[^`\n]*`/g, "");
}

/**
 * Turns heading text into the anchor GitHub generates for it.
 *
 * @param {string} heading Heading text as written.
 * @returns {string} Slug, without the duplicate-suffix.
 */
export function slugify(heading) {
  return heading
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^<>]+>/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

/**
 * Collects every anchor a Markdown file offers: explicit `<a id>` and heading slugs.
 *
 * @param {string} text Markdown text.
 * @returns {Set<string>} Valid fragment names.
 */
export function collectAnchors(text) {
  const anchors = new Set();
  const body = stripFences(text);
  for (const match of body.matchAll(/<a\s+(?:id|name)=["']([^"']+)["']/g)) anchors.add(match[1]);
  const seen = new Map();
  for (const match of body.matchAll(/^#{1,6}[ \t]+(.+)$/gm)) {
    const slug = slugify(match[1].replace(/[ \t]+#+$/, ""));
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    anchors.add(count === 0 ? slug : `${slug}-${count}`);
  }
  return anchors;
}

/**
 * Extracts relative link targets (not http, mailto or bare-anchor-less) from Markdown.
 *
 * @param {string} text Markdown text.
 * @returns {string[]} Raw link targets.
 */
function relativeTargets(text) {
  const targets = [];
  for (const match of stripCode(text).matchAll(/\]\(<?([^)\s>]+)[^)]*\)/g)) {
    if (!/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(match[1])) targets.push(match[1]);
  }
  return targets;
}

/**
 * Checks one link target from one file.
 *
 * @param {string} file Absolute path of the file containing the link.
 * @param {string} target Raw link target.
 * @param {(path: string) => Set<string>} anchorsOf Cached anchor lookup.
 * @returns {string | null} Problem description, or null when the link is fine.
 */
function checkTarget(file, target, anchorsOf) {
  const [rawPath, rawFragment] = target.split("#");
  const path = decodeURIComponent(rawPath);
  const destination = path === "" ? file : resolve(dirname(file), path);
  if (!existsSync(destination)) return `broken link "${target}": ${path} does not exist`;
  if (rawFragment && destination.endsWith(".md") && statSync(destination).isFile()) {
    const fragment = decodeURIComponent(rawFragment).toLowerCase();
    const anchors = anchorsOf(destination);
    if (!anchors.has(fragment) && !anchors.has(rawFragment)) {
      return `broken anchor "${target}": no heading or <a id> "${rawFragment}" in ${path || "this file"}`;
    }
  }
  return null;
}

/**
 * Reports every relative link or anchor in docs/ that does not resolve.
 *
 * @param {string} root Repo root.
 * @returns {string[]} Error messages naming the file and the link.
 */
export function checkRelativeLinks(root) {
  const cache = new Map();
  const anchorsOf = (path) => {
    if (!cache.has(path)) cache.set(path, collectAnchors(readFileSync(path, "utf8")));
    return cache.get(path);
  };
  const errors = [];
  for (const file of listFiles(join(root, "docs"), ".md")) {
    for (const target of relativeTargets(readFileSync(file, "utf8"))) {
      const problem = checkTarget(file, target, anchorsOf);
      if (problem) errors.push(`${relative(root, file)}: ${problem}`);
    }
  }
  return errors;
}

/**
 * Lists the decisions of the closed log (`docs/DECISIONS.md`, ADR-001 to ADR-035) by number.
 *
 * @param {string} root Repo root.
 * @returns {{ key: string, label: string }[]} One entry per `## ADR-n` heading; the key has no leading zeros.
 */
function legacyDecisions(root) {
  const file = join(root, "docs/DECISIONS.md");
  if (!existsSync(file)) return [];
  return [...readFileSync(file, "utf8").matchAll(/^## ADR-(\d+)\b.*$/gm)].map((m) => ({
    key: String(Number(m[1])),
    label: `DECISIONS.md "${m[0].slice(3, 60)}"`,
  }));
}

/**
 * Lists the decision files in `docs/decisions/` by issue number and reports files that break the naming rules.
 *
 * @param {string} root Repo root.
 * @returns {{ decisions: { key: string, label: string }[], errors: string[] }} Decisions found and naming errors.
 */
function fileDecisions(root) {
  const dir = join(root, "docs/decisions");
  const decisions = [];
  const errors = [];
  for (const file of listFiles(dir, ".md").filter((f) => !f.endsWith("README.md"))) {
    const name = relative(root, file);
    const prefix = /^(\d+)([a-z]?)-/.exec(file.slice(dir.length + 1));
    if (!prefix) {
      errors.push(`Decision file ${name} must be named <issue>-<slug>.md (see docs/decisions/README.md).`);
      continue;
    }
    const key = String(Number(prefix[1])) + prefix[2];
    const heading = /^# ADR-(\d+)([a-z]?)\b/.exec(readFileSync(file, "utf8"));
    if (!heading || String(Number(heading[1])) + heading[2] !== key) {
      errors.push(
        `Decision file ${name} must start with "# ADR-${key} · <date> · <title>" to match its file name.`,
      );
    }
    decisions.push({ key, label: name });
  }
  return { decisions, errors };
}

/**
 * Checks decision numbers: unique across the closed log and `docs/decisions/`, and decision files named by issue.
 *
 * Parallel PRs each took "the next free number", so two of them could pick the same one and a clean-looking
 * merge hid it (issue #76). New decisions are numbered by their issue, which is unique; this check keeps it so.
 *
 * @param {string} root Repo root.
 * @returns {string[]} One error per duplicated number or badly named decision file.
 */
export function checkAdrNumbers(root) {
  const { decisions, errors } = fileDecisions(root);
  const byKey = new Map();
  for (const { key, label } of [...legacyDecisions(root), ...decisions]) {
    byKey.set(key, [...(byKey.get(key) ?? []), label]);
  }
  for (const [key, labels] of byKey) {
    if (labels.length < 2) continue;
    errors.push(
      `Duplicate ADR number: ADR-${key} is used ${labels.length} times (${labels.join("; ")}). ` +
        "Decisions are numbered by the issue that makes them (docs/decisions/README.md).",
    );
  }
  return errors;
}

/**
 * Checks that the "which check runs for which paths" table in docs/WORKFLOW.md matches the CI rule tables (issue #188).
 *
 * @param {string} root Repo root.
 * @returns {string[]} An error message list (empty when the table is fresh or the file has no table).
 */
export function checkCiTable(root) {
  const file = join(root, "docs/WORKFLOW.md");
  if (!existsSync(file)) return [];
  const text = readFileSync(file, "utf8");
  const start = text.indexOf(TABLE_START);
  const end = text.indexOf(TABLE_END);
  if (start === -1 || end === -1) return [];
  const current = text.slice(start + TABLE_START.length, end);
  return normalizeTable(current) === normalizeTable(ruleTable())
    ? []
    : [
        "Stale CI table in docs/WORKFLOW.md. Run: node scripts/ci-paths.mjs --write-table && pnpm prettier --write docs/WORKFLOW.md",
      ];
}

/**
 * Runs all handbook checks.
 *
 * @param {string} root Repo root.
 * @returns {string[]} All error messages (empty when everything passes).
 */
export function checkHandbook(root) {
  return [
    ...checkDependencyCards(root),
    ...checkRelativeLinks(root),
    ...checkAdrNumbers(root),
    ...checkLearningLogIndex(root),
    ...checkCiTable(root),
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = checkHandbook(process.cwd());
  if (errors.length > 0) {
    console.error(`docs:check found ${errors.length} problem(s):\n`);
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }
  console.log(
    "docs:check OK (every dependency has a card; every relative link resolves; ADR numbers are unique; learning-log index is fresh)",
  );
}
