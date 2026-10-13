/** Fails when the checked-in PatternResult JSON Schema is stale (run `pnpm schemas:json`). */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { patternResultJsonSchemaText } from "./pattern-json-schema";

describe("pattern-result.schema.json", () => {
  it("matches the Zod schema", () => {
    const file = readFileSync(new URL("../json/pattern-result.schema.json", import.meta.url), "utf8");
    expect(file).toBe(patternResultJsonSchemaText());
  });
});
