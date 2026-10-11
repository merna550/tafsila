// Tests for scripts/check-handbook.mjs using throw-away fixture repos in a temp directory.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkDependencyCards,
  checkAdrNumbers,
  checkHandbook,
  checkRelativeLinks,
  collectAnchors,
  parseFrontMatter,
  slugify,
} from "./check-handbook.mjs";

const roots = [];

/**
 * Writes files into a fresh fixture repo.
 *
 * @param files Map of repo-relative path to file content.
 * @returns Absolute path of the fixture root.
 */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "docs-check-"));
  roots.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const card = (packagesYaml) => `---\npackages: ${packagesYaml}\nlevel: beginner\nadr: none\n---\n\n# Card\n`;
const manifest = (deps, dev = {}) => JSON.stringify({ name: "x", dependencies: deps, devDependencies: dev });

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("dependency cards", () => {
  it("passes when every dependency is covered, ignoring @tafsila/* and @types/*", () => {
    const root = fixture({
      "package.json": manifest({ zod: "1", "@tafsila/utils": "workspace:*" }, { "@types/node": "1" }),
      "docs/handbook/tech/zod.md": card("[zod]"),
    });
    expect(checkDependencyCards(root)).toEqual([]);
  });

  it("fails and names the dependency when no card covers it (deliberate failing example)", () => {
    const root = fixture({
      "package.json": manifest({ zod: "1", "left-pad": "1" }),
      "apps/web/package.json": manifest({}, { vitest: "1" }),
      "docs/handbook/tech/zod.md": card("[zod]"),
    });
    const errors = checkDependencyCards(root);
    expect(errors).toHaveLength(2);
    expect(errors.join("\n")).toContain('Missing tech card: "left-pad" (in package.json)');
    expect(errors.join("\n")).toContain('Missing tech card: "vitest" (in apps/web/package.json)');
  });

  it("reads packages that Prettier reflowed over several lines, and accepts packages: []", () => {
    const root = fixture({
      "package.json": manifest({ a: "1", b: "1" }),
      "docs/handbook/tech/multi.md": card("\n  [\n    a,\n    b,\n  ]"),
      "docs/handbook/tech/empty.md": card("[]"),
    });
    expect(checkDependencyCards(root)).toEqual([]);
  });

  it("does not require card packages to be installed", () => {
    const root = fixture({
      "package.json": manifest({}),
      "docs/handbook/tech/planned.md": card("[drizzle-orm]"),
    });
    expect(checkDependencyCards(root)).toEqual([]);
  });

  it("reports a card without a packages list", () => {
    const root = fixture({
      "package.json": manifest({}),
      "docs/handbook/tech/bad.md": "---\nlevel: beginner\n---\n# Bad\n",
    });
    expect(checkDependencyCards(root)[0]).toContain('needs a "packages:" list');
  });
});

describe("relative links", () => {
  it("passes for existing files, directories, anchors and links in code", () => {
    const root = fixture({
      "docs/a.md":
        "# A\n[b](b.md) [dir](sub/) [anchor](b.md#my-heading) [self](#a) [ext](https://x.dev)\n`[x](nope.md)`\n",
      "docs/b.md": "## My heading\n",
      "docs/sub/c.md": "# C\n",
    });
    expect(checkRelativeLinks(root)).toEqual([]);
  });

  it("fails and names the file and link when a relative link is broken (deliberate failing example)", () => {
    const root = fixture({ "docs/a.md": "# A\nSee [gone](missing/page.md).\n" });
    const errors = checkRelativeLinks(root);
    expect(errors).toEqual(['docs/a.md: broken link "missing/page.md": missing/page.md does not exist']);
  });

  it("fails when an anchor does not exist but accepts explicit <a id> anchors", () => {
    const root = fixture({
      "docs/a.md": "[ok](b.md#term) [bad](b.md#nothing)\n",
      "docs/b.md": '<a id="term"></a>\n\n### Term\n',
    });
    const errors = checkRelativeLinks(root);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('broken anchor "b.md#nothing"');
  });
});

describe("anchors and front matter", () => {
  it("builds GitHub heading slugs including code, punctuation and duplicates", () => {
    expect(slugify("`pnpm dev` fails: wrong Node version")).toBe("pnpm-dev-fails-wrong-node-version");
    const anchors = collectAnchors("# Same\n## Same\n```\n# not a heading\n```\n");
    expect([...anchors]).toEqual(["same", "same-1"]);
  });

  it("returns null when there is no front matter", () => {
    expect(parseFrontMatter("# Title\n")).toBeNull();
  });

  it("passes on the whole fixture when both checks are clean", () => {
    const root = fixture({ "package.json": manifest({}), "docs/a.md": "# A\n" });
    expect(checkHandbook(root)).toEqual([]);
  });
});

describe("ADR numbers (issue #76)", () => {
  it("accepts a log where every number appears once", () => {
    const root = fixture({ "docs/DECISIONS.md": "# Log\n\n## ADR-002 · b\n\ntext\n\n## ADR-001 · a\n" });
    expect(checkAdrNumbers(root)).toEqual([]);
  });

  it("names a number used twice and both headings", () => {
    const root = fixture({
      "docs/DECISIONS.md":
        "## ADR-032 · Outcome check\n\n## ADR-031 · Design\n\n## ADR-032 · Layout components\n",
    });
    const errors = checkAdrNumbers(root);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("ADR-032 is used 2 times");
    expect(errors[0]).toContain("Outcome check");
    expect(errors[0]).toContain("Layout components");
    expect(checkHandbook(root)).toEqual(errors);
  });

  it("passes when there is no decision log", () => {
    expect(checkAdrNumbers(fixture({}))).toEqual([]);
  });
});
