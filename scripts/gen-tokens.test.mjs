// Tests for the design token generator (issue #80).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { applyBlock, buildBlock, resolve, run, toRem } from "./gen-tokens.mjs";

const REAL = new URL("..", import.meta.url).pathname;
const json = JSON.parse(readFileSync(join(REAL, "docs/design-system/tokens.json"), "utf8"));
const roots = [];

/**
 * Copies the real tokens.json and tokens.css into a temporary repository root.
 *
 * @returns {string} The temporary root.
 */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "gen-tokens-"));
  roots.push(root);
  mkdirSync(join(root, "docs/design-system"), { recursive: true });
  mkdirSync(join(root, "packages/ui/src"), { recursive: true });
  cpSync(join(REAL, "docs/design-system/tokens.json"), join(root, "docs/design-system/tokens.json"));
  cpSync(join(REAL, "packages/ui/src/tokens.css"), join(root, "packages/ui/src/tokens.css"));
  return root;
}
afterAll(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));

describe("helpers", () => {
  it("converts px to rem", () => {
    expect(toRem("16px")).toBe("1rem");
    expect(toRem("17px")).toBe("1.0625rem");
  });

  it("follows {reference} values", () => {
    expect(resolve(json.color.tokens, "focus-ring")).toBe(resolve(json.color.tokens, "primary"));
  });

  it("throws for an unknown token", () => {
    expect(() => resolve(json.color.tokens, "nope")).toThrow(/nope/);
  });
});

describe("buildBlock", () => {
  const block = buildBlock(json);

  it("maps approved tokens onto the existing role names", () => {
    expect(block).toContain("--color-background: #fbf7f1;");
    expect(block).toContain("--color-text: #2a2220;");
    expect(block).toContain("--color-focus: #0e6b65;");
    expect(block).toContain("--color-primary-hover: #0a5651;");
  });

  it("emits the brand type scale and shadows", () => {
    expect(block).toContain("--text-base: 1.0625rem;");
    expect(block).toContain("--text-base--line-height: 1.75rem;");
    expect(block).toContain("--shadow-card:");
    expect(block).not.toContain("--color-secondary");
  });
});

describe("applyBlock and run", () => {
  it("is idempotent", () => {
    const css = readFileSync(join(REAL, "packages/ui/src/tokens.css"), "utf8");
    expect(applyBlock(css, json)).toBe(css);
  });

  it("fails without markers", () => {
    expect(() => applyBlock("@theme {}", json)).toThrow(/markers/);
  });

  it("detects drift in check mode and fixes it when writing", () => {
    const root = fixture();
    const file = join(root, "packages/ui/src/tokens.css");
    writeFileSync(file, readFileSync(file, "utf8").replace("#fbf7f1", "#000000"));
    expect(run(root, true)).toBe(false);
    expect(readFileSync(file, "utf8")).toContain("#000000");
    expect(run(root, false)).toBe(true);
    expect(run(root, true)).toBe(true);
  });

  it("keeps hand-written parts outside the markers", () => {
    const root = fixture();
    run(root, false);
    expect(readFileSync(join(root, "packages/ui/src/tokens.css"), "utf8")).toContain("--z-modal: 1300;");
  });
});
