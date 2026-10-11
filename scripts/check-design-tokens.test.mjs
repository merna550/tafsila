// Tests for the CSS raw-colour check (issue #66).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { findRawColors } from "./check-design-tokens.mjs";

const root = mkdtempSync(join(tmpdir(), "tokens-"));
mkdirSync(join(root, "packages/ui/src"), { recursive: true });
mkdirSync(join(root, "apps/web/src/app"), { recursive: true });
writeFileSync(join(root, "packages/ui/src/tokens.css"), "@theme { --color-primary: #112233; }\n");
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("findRawColors", () => {
  it("allows raw colours in tokens.css and token references elsewhere", () => {
    writeFileSync(join(root, "apps/web/src/app/ok.css"), "body { color: var(--color-primary); }\n");
    expect(findRawColors(root)).toEqual([]);
  });

  it("reports hex and rgb colours in any other stylesheet", () => {
    writeFileSync(join(root, "apps/web/src/app/bad.css"), "a { color: #fff; }\nb { color: rgb(0 0 0); }\n");
    const found = findRawColors(root);
    expect(found).toHaveLength(2);
    expect(found[0]).toContain("bad.css:1");
  });
});
