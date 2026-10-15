import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rectanglePattern } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { renderPrintSheet } from "../src/render";
import { run } from "./print";

/**
 * Runs the CLI and collects what it prints.
 *
 * @param argv - Arguments.
 * @returns Exit code and the lines written.
 */
function runCli(argv: string[]): { code: number; out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  const code = run(argv, { out: (l) => out.push(l), err: (l) => err.push(l) });
  return { code, out, err };
}

describe("engine:print", () => {
  it("writes the rectangle print sheet", () => {
    const file = join(mkdtempSync(join(tmpdir(), "print-")), "toile.svg");
    const { code } = runCli(["rectangle", "size-m", "--out", file]);
    expect(code).toBe(0);
    expect(readFileSync(file, "utf8")).toBe(renderPrintSheet(rectanglePattern));
  });

  it("answers wrong arguments with usage and code 2", () => {
    for (const argv of [
      [],
      ["rectangle"],
      ["nope", "size-m"],
      ["rectangle", "size-zz"],
      ["rectangle", "size-m", "--out"],
    ]) {
      const { code, err } = runCli(argv);
      expect(code).toBe(2);
      expect(err.join("\n")).toContain("Usage:");
    }
  });

  it("writes nothing for an unknown fixture", () => {
    const file = join(mkdtempSync(join(tmpdir(), "print-")), "none.svg");
    runCli(["nope", "size-m", "--out", file]);
    expect(existsSync(file)).toBe(false);
  });

  it("exits 1 for a design with no modules yet", () => {
    const { code, err } = runCli(["vNeckHalfCircleDress", "size-m"]);
    expect(code).toBe(1);
    expect(err.join("\n")).toContain("no pieces");
  });
});
