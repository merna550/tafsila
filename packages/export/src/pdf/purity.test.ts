/** Guards the PDF code against clock and random use, which would break byte-identical rebuilds (issue #288). */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = new URL("./", import.meta.url);
const sources = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

describe("pdf sources are deterministic", () => {
  it.each(sources)("%s has no clock or random call", (file) => {
    const text = readFileSync(new URL(file, dir), "utf8");
    expect(text).not.toMatch(/Date\.now\(|new Date\(\)|Math\.random\(|performance\.now\(/);
  });
});
