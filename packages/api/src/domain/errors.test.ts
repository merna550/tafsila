import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ERROR_CATALOGUE } from "./errors";

const SRC_DIR = join(__dirname, "..");
const DOC_PATH = join(__dirname, "../../../../docs/errors.md");
const ARABIC_LETTER = /[؀-ۿ]/;
const THROWN_CODE = /new AppError\(\s*"([A-Z_]+)"/g;

/**
 * Lists every non-test TypeScript file under a folder.
 *
 * @param dir - Folder to scan.
 * @returns Absolute file paths.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") && !path.endsWith(".test.ts") ? [path] : [];
  });
}

/**
 * Finds every code literal passed to `new AppError("CODE"` in the API source.
 *
 * @returns The code strings.
 */
function thrownCodes(): string[] {
  return sourceFiles(SRC_DIR).flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(THROWN_CODE)].map((m) => m[1] ?? ""),
  );
}

describe("error catalogue", () => {
  it("has an Arabic message with Arabic letters for every code", () => {
    for (const [code, def] of Object.entries(ERROR_CATALOGUE)) {
      expect(def.messageAr, code).toMatch(ARABIC_LETTER);
      expect(def.messageEn, code).not.toBe("");
    }
  });

  it("contains every code that is thrown with `new AppError(...)`", () => {
    for (const code of thrownCodes()) expect(Object.keys(ERROR_CATALOGUE), code).toContain(code);
  });

  it("lists every code with its Arabic message in docs/errors.md", () => {
    const doc = readFileSync(DOC_PATH, "utf8");
    for (const [code, def] of Object.entries(ERROR_CATALOGUE)) {
      expect(doc, `${code} row`).toContain(`\`${code}\``);
      expect(doc, `${code} Arabic message`).toContain(def.messageAr);
    }
  });
});
