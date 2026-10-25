/** Tests of the option drawings: complete against the schema, colour-safe and valid (issue #241). */
import { designSpecSchema, garmentCategorySchema } from "@tafsila/schemas";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ILLUSTRATIONS, findIllustration, listIllustrations } from "./catalogue";
import { OptionIllustration } from "./OptionIllustration";
import type { IllustratedPath } from "./types";

const neckline = designSpecSchema.shape.neckline.unwrap().shape;
const sleeve = designSpecSchema.shape.sleeve.unwrap().shape;
const skirt = designSpecSchema.shape.skirt.unwrap().shape;

/** Option values of each illustrated path, read from the schema. */
const SCHEMA_OPTIONS: Record<IllustratedPath, readonly string[]> = {
  category: garmentCategorySchema.options,
  "bodice.shaping": designSpecSchema.shape.bodice.unwrap().shape.shaping.options,
  "neckline.front": neckline.front.options,
  "neckline.back": neckline.back.options,
  "neckline.collar": neckline.collar.options,
  "sleeve.type": sleeve.type.options,
  "sleeve.length": sleeve.length.options,
  "sleeve.cuff": sleeve.cuff.options,
  "skirt.type": skirt.type.options,
  "skirt.length": skirt.length.options,
  waistband: designSpecSchema.shape.waistband.unwrap().options,
  "closure.type": designSpecSchema.shape.closure.shape.type.options,
  pockets: designSpecSchema.shape.pockets.element.options,
  belt: designSpecSchema.shape.belt.unwrap().options,
  lining: ["true", "false"],
};

/**
 * Lists the (path, value) pairs of the schema that have no drawing.
 *
 * @param options - Option values by path.
 * @returns The missing pairs.
 */
function missingDrawings(options: Record<string, readonly string[]>): string[] {
  return Object.entries(options).flatMap(([path, values]) =>
    values
      .filter((value) => (findIllustration(path, value)?.length ?? 0) === 0)
      .map((value) => `${path}=${value}`),
  );
}

describe("option illustrations", () => {
  it("has a non-empty drawing for every schema option", () => {
    expect(missingDrawings(SCHEMA_OPTIONS)).toEqual([]);
    expect(listIllustrations()).toHaveLength(60);
  });

  it("reports a value that has no drawing", () => {
    const withExtra = { ...SCHEMA_OPTIONS, "sleeve.type": [...SCHEMA_OPTIONS["sleeve.type"], "new"] };
    expect(missingDrawings(withExtra)).toEqual(["sleeve.type=new"]);
  });

  it("draws with currentColor only", () => {
    for (const { path, value } of listIllustrations()) {
      const html = renderToStaticMarkup(<OptionIllustration path={path} value={value as never} />);
      expect(html).toContain('stroke="currentColor"');
      expect(html).toContain('fill="none"');
      expect(html).not.toMatch(/#|rgb\(|hsl\(|style=|<script/);
    }
  });

  it("uses only path commands and coordinates inside 0 to 64", () => {
    for (const { path, value } of listIllustrations()) {
      for (const d of findIllustration(path, value) ?? []) {
        expect(d).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9 .,-]+$/);
        const numbers = d.match(/-?\d+(\.\d+)?/g) ?? [];
        expect(numbers.every((n) => Number(n) >= 0 && Number(n) <= 64)).toBe(true);
      }
    }
  });

  it("gives different values of one path different drawings", () => {
    for (const [path, byValue] of Object.entries(ILLUSTRATIONS)) {
      const keys = Object.values(byValue).map((drawing) => drawing.join("|"));
      expect(new Set(keys).size, path).toBe(keys.length);
    }
  });

  it("renders nothing for an unknown value", () => {
    expect(OptionIllustration({ path: "belt", value: "x" as never })).toBeNull();
  });
});
