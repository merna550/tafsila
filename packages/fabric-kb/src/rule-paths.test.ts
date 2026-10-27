import { designSpecSchema } from "@tafsila/schemas";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { RULE_PATHS } from "./rule-paths";

/** The part of a JSON Schema node these tests read. */
interface JsonNode {
  properties?: Record<string, JsonNode>;
  enum?: string[];
  items?: JsonNode;
}

const jsonSchema = z.toJSONSchema(designSpecSchema) as JsonNode;

/**
 * Reads the allowed values of a dotted DesignSpec path from the JSON Schema of `designSpecSchema`.
 *
 * @param path - Dotted path such as `skirt.type`.
 * @returns The enum values, or an empty list when the path is not an enum.
 */
function schemaOptions(path: string): string[] {
  let node: JsonNode | undefined = jsonSchema;
  for (const key of path.split(".")) node = node?.properties?.[key];
  return (node?.items ?? node)?.enum ?? [];
}

describe("RULE_PATHS", () => {
  it.each(Object.entries(RULE_PATHS).filter(([, spec]) => spec.kind !== "flag"))(
    "%s equals the designSpecSchema enum",
    (path, spec) => {
      const values = "values" in spec ? [...spec.values] : [];
      expect(values.toSorted((a, b) => a.localeCompare(b))).toEqual(
        schemaOptions(path).toSorted((a, b) => a.localeCompare(b)),
      );
    },
  );

  it("the flag path is a boolean in the schema", () => {
    expect(designSpecSchema.shape.lining.safeParse(true).success).toBe(true);
    expect(RULE_PATHS.lining).toEqual({ kind: "flag" });
  });
});
