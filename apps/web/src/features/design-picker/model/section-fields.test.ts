import { candidateValues, FEATURE_PATHS, OVERRIDE_LIMITS_MM } from "@tafsila/engine/spec-rules";
import { describe, expect, it } from "vitest";
import ar from "@messages/ar.json";
import en from "@messages/en.json";
import { FIELDS_BY_SECTION, PATHS_OUTSIDE_SECTIONS, shownFeaturePaths } from "./section-fields";
import { SECTION_PATHS, SECTION_ORDER } from "./sections";
import { pathMessageKey } from "./spec-path";

/**
 * Sorts text alphabetically on a copy.
 *
 * @param items - The texts.
 * @returns A sorted copy.
 */
function sorted(items: readonly string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b));
}

describe("FIELDS_BY_SECTION", () => {
  it("shows every engine feature path exactly once, except the garment type", () => {
    const shown = shownFeaturePaths();
    expect(new Set(shown).size).toBe(shown.length);
    const expected = FEATURE_PATHS.filter((p) => !PATHS_OUTSIDE_SECTIONS.includes(p));
    expect(sorted(shown)).toEqual(sorted(expected));
  });

  it("agrees with the section list on which feature belongs to which section", () => {
    for (const id of SECTION_ORDER) {
      const own = FIELDS_BY_SECTION[id].filter((f) => f.kind !== "number").map((f) => f.path);
      expect(sorted(own)).toEqual(sorted(SECTION_PATHS[id]));
    }
  });

  it("has a length field for every override with limits", () => {
    const numbers = Object.values(FIELDS_BY_SECTION)
      .flat()
      .filter((f) => f.kind === "number")
      .map((f) => f.path);
    expect(sorted(numbers)).toEqual(sorted(Object.keys(OVERRIDE_LIMITS_MM)));
  });
});

describe("messages", () => {
  it.each([
    ["ar", ar],
    ["en", en],
  ] as const)("has a name for every option value and a title for every field in %s", (_name, messages) => {
    const picker = messages.designPicker as unknown as Record<string, Record<string, unknown>>;
    for (const path of FEATURE_PATHS) {
      if (path === "category") continue;
      const key = pathMessageKey(path);
      expect(picker.paths?.[key], `title ${key}`).toBeTruthy();
      const names = picker.options?.[key] as Record<string, string> | undefined;
      for (const value of candidateValues(path))
        expect(names?.[String(value)], `${key}.${value}`).toBeTruthy();
    }
    for (const path of Object.keys(OVERRIDE_LIMITS_MM)) {
      expect(picker.overrides?.[path.replaceAll(".", "_")], path).toBeTruthy();
    }
  });
});
