// Tests for scripts/learning-log-index.mjs: ordering, link rewriting, staleness and conflict-free merges.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkHandbook } from "./check-handbook.mjs";
import { checkLearningLogIndex, relinkForIndex, renderIndex } from "./learning-log-index.mjs";

const roots = [];

/**
 * Builds a log entry file text.
 *
 * @param date - Entry date.
 * @param issue - Issue label.
 * @param concept - Concept sentence.
 * @returns The file content.
 */
const entry = (date, issue, concept) =>
  `---\ndate: "${date}"\nissue: "${issue}"\ntitle: "t"\n---\n\n${concept}\n\nRead: [Glossary](../glossary.md#x)\n`;

/**
 * Writes files into a fresh temp repo.
 *
 * @param files - Map of repo-relative path to content.
 * @returns The repo root.
 */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "log-"));
  roots.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("learning log index", () => {
  it("lists newest first and rewrites links to be relative to the handbook folder", () => {
    const root = fixture({
      "docs/handbook/learning-log/1-a.md": entry("2026-10-01", "#1", "Older"),
      "docs/handbook/learning-log/2-b.md": entry("2026-10-02", "#2", "Newer"),
    });
    const lines = renderIndex(root)
      .split("\n")
      .filter((l) => l.startsWith("| 2026"));
    expect(lines[0]).toBe("| 2026-10-02 | #2 | Newer | [Glossary](glossary.md#x) |");
    expect(lines[1]).toContain("#1");
    expect(relinkForIndex("[a](https://x.dev) [b](../../c.md)")).toBe("[a](https://x.dev) [b](../c.md)");
  });

  it("fails docs:check when a log file was added but the index was not regenerated", () => {
    const root = fixture({ "docs/handbook/learning-log/1-a.md": entry("2026-10-01", "#1", "One") });
    writeFileSync(join(root, "docs/handbook/learning-log.md"), renderIndex(root));
    expect(checkLearningLogIndex(root)).toEqual([]);
    writeFileSync(join(root, "docs/handbook/learning-log/2-b.md"), entry("2026-10-02", "#2", "Two"));
    expect(checkLearningLogIndex(root)[0]).toContain("pnpm learning-log:index");
    expect(checkHandbook(root).join("\n")).toContain("Stale docs/handbook/learning-log.md");
  });

  it("merges two branches that each add a log file without a conflict", () => {
    const root = fixture({ "docs/handbook/learning-log/1-a.md": entry("2026-10-01", "#1", "One") });
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- git is preinstalled on runners and developer machines
    const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
    const index = join(root, "docs/handbook/learning-log.md");
    writeFileSync(index, renderIndex(root));
    writeFileSync(join(root, ".gitattributes"), "docs/handbook/learning-log.md merge=ours\n");
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@t.dev");
    git("config", "user.name", "t");
    git("config", "merge.ours.driver", "true");
    git("add", "-A");
    git("commit", "-qm", "base");
    for (const [branch, n] of [
      ["a", 2],
      ["b", 3],
    ]) {
      git("checkout", "-q", "-b", branch, "main");
      writeFileSync(
        join(root, `docs/handbook/learning-log/${n}-x.md`),
        entry(`2026-10-0${n}`, `#${n}`, `C${n}`),
      );
      writeFileSync(index, renderIndex(root));
      git("add", "-A");
      git("commit", "-qm", branch);
    }
    git("checkout", "-q", "a");
    git("merge", "-q", "--no-edit", "b");
    writeFileSync(index, renderIndex(root));
    expect(checkLearningLogIndex(root)).toEqual([]);
    expect(readFileSync(index, "utf8")).toContain("#3");
    expect(readFileSync(index, "utf8")).toContain("#2");
  });

  it("matches the committed index for the real repo", () => {
    expect(checkLearningLogIndex(process.cwd())).toEqual([]);
  });
});
