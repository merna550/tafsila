// Proves each architecture and lint rule of issue #66 fails on a deliberate violation (ADR-029, ADR-031).
// Violating files are written under a temporary folder, checked, and always deleted.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { ESLint } from "eslint";

const ROOT = new URL("..", import.meta.url).pathname;
const WEB = "apps/web/src";
const FIXTURE_DIRS = [
  `${WEB}/features/zz-rule-check`,
  `${WEB}/app/zz-rule-check`,
  `${WEB}/shared/zz-rule-check`,
];
const SLOW_TEST_MS = 120_000;

/**
 * Writes fixture files relative to the repository root.
 *
 * @param files Map of relative path to file content.
 */
function writeFixtures(files) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    writeFileSync(join(ROOT, path), content);
  }
}

/**
 * Removes every fixture folder.
 *
 */
function cleanFixtures() {
  for (const dir of FIXTURE_DIRS) rmSync(join(ROOT, dir), { recursive: true, force: true });
}

/**
 * Runs dependency-cruiser on the web sources and returns the names of the rules that were violated.
 *
 * @returns Sorted unique rule names.
 */
function violatedRules() {
  let output;
  try {
    output = execFileSync(
      process.execPath,
      [
        "node_modules/dependency-cruiser/bin/dependency-cruiser.mjs",
        "apps/web/src",
        "--config",
        ".dependency-cruiser.cjs",
        "--output-type",
        "json",
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
  } catch (error) {
    output = error.stdout;
  }
  const { summary } = JSON.parse(output);
  return [...new Set(summary.violations.map((v) => v.rule.name))].sort();
}

/**
 * Lints one fixture file with the real project config.
 *
 * @param path Fixture path relative to the repository root.
 * @param code File content.
 * @returns Messages produced by ESLint.
 */
async function lintFixture(path, code) {
  writeFixtures({ [path]: code });
  const [result] = await new ESLint({ cwd: ROOT }).lintFiles([path]);
  return result.messages;
}

afterAll(cleanFixtures);

describe("dependency-cruiser frontend layer rules", () => {
  const cases = [
    [
      "ui-layer-is-presentational",
      "features/zz-rule-check/components/a.ts",
      'import "../../../shared/api";\n',
    ],
    [
      "ui-layer-is-presentational",
      "features/zz-rule-check/components/b.ts",
      'import "@tanstack/react-query";\n',
    ],
    ["domain-layer-is-pure", "features/zz-rule-check/model/a.ts", 'import "react";\n'],
    ["application-layer-not-ui", "features/zz-rule-check/hooks/a.ts", 'import "../components/c";\n'],
    ["features-through-index", "features/zz-rule-check/model/b.ts", 'import "../../home/SignupButton";\n'],
    [
      "app-through-feature-index",
      "app/zz-rule-check/page.ts",
      'import "../../features/home/SignupButton";\n',
    ],
    ["shared-not-features", "shared/zz-rule-check/a.ts", 'import "../../features/home";\n'],
    ["supabase-only-in-auth", "features/zz-rule-check/hooks/b.ts", 'import "@supabase/supabase-js";\n'],
    ["query-only-in-hooks", "app/zz-rule-check/query.ts", 'import "@tanstack/react-query";\n'],
  ];

  it.each(cases)(
    "%s fails on %s",
    (rule, path, code) => {
      cleanFixtures();
      writeFixtures({
        [`${WEB}/${path}`]: code,
        [`${WEB}/features/zz-rule-check/components/c.ts`]: "export {};\n",
      });
      expect(violatedRules()).toContain(rule);
    },
    SLOW_TEST_MS,
  );

  it(
    "passes when the layers are respected",
    () => {
      cleanFixtures();
      writeFixtures({
        [`${WEB}/features/zz-rule-check/hooks/ok.ts`]: 'import "../model/m";\n',
        [`${WEB}/features/zz-rule-check/components/c.ts`]: 'import "../model/m";\n',
        [`${WEB}/features/zz-rule-check/model/m.ts`]: "export const value = 1;\n",
      });
      expect(violatedRules().filter((name) => name.includes("layer") || name.includes("feature"))).toEqual(
        [],
      );
    },
    SLOW_TEST_MS,
  );
});

describe("ESLint frontend rules", () => {
  const component = `${WEB}/features/zz-rule-check/components/lint.tsx`;
  const jsx = (body) => `export const X = (): null => {\n  void (${body});\n  return null;\n};\n`;
  const cases = [
    ["raw hex colour", `const c = "#ff0000"; export { c };\n`],
    ["raw rgb colour", `const c = "rgb(1, 2, 3)"; export { c };\n`],
    ["arbitrary tailwind value", `const c = "bg-[#123456] w-[13px]"; export { c };\n`],
    ["physical direction class", `const c = "ml-4 text-left"; export { c };\n`],
    ["physical direction after variant", `const c = "md:pr-2 rounded-tl-lg"; export { c };\n`],
    ["hard-coded JSX text", jsx("<p>مرحبا</p>")],
    ["hard-coded aria-label", jsx('<button aria-label="Close" />')],
    ["fetch outside shared/api", `export const load = (): Promise<Response> => fetch("/api/x");\n`],
  ];

  it.each(cases)(
    "rejects %s",
    async (_name, code) => {
      const messages = await lintFixture(component, code);
      expect(
        messages.filter((m) => m.severity === 2 && m.ruleId?.startsWith("no-restricted")),
      ).not.toHaveLength(0);
    },
    SLOW_TEST_MS,
  );

  it(
    "accepts tokens, logical classes and translated text",
    async () => {
      const code = `const c = "bg-primary ms-4 text-start"; export { c };\nexport const y = (t: (k: string) => string): string => t("home.title");\n`;
      const messages = await lintFixture(component, code);
      expect(messages.filter((m) => m.ruleId?.startsWith("no-restricted"))).toEqual([]);
    },
    SLOW_TEST_MS,
  );
});
