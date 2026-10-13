/** Builds the JSON Schema of `PatternResult` for non-TypeScript consumers (exports, v2 sim service). */
import { z } from "zod";
import { patternResultSchema } from "./pattern";

/**
 * Recursively sorts object keys so the generated file is stable.
 *
 * @param value - Any JSON value.
 * @returns The same value with sorted object keys.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

/**
 * The checked-in JSON text of the PatternResult JSON Schema.
 *
 * @returns Stable, newline-terminated JSON text.
 */
export function patternResultJsonSchemaText(): string {
  const schema = z.toJSONSchema(patternResultSchema, { io: "output" });
  return `${JSON.stringify(sortKeys(schema), null, 2)}\n`;
}
