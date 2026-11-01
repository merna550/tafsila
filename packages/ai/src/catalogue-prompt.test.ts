/** Drift tests: the prompt catalogue is generated from designSpecSchema (issue #337, acceptance criterion 3). */
import { describe, expect, it } from "vitest";
import {
  buildCataloguePrompt,
  catalogueDrift,
  FEATURE_DEFINITIONS,
  schemaFeatureValues,
} from "./catalogue-prompt";
import { analyzeSystemPrompt, chatSystemPrompt } from "./prompts";

describe("feature catalogue", () => {
  it("defines every schema value and nothing else", () => {
    expect(catalogueDrift(FEATURE_DEFINITIONS, schemaFeatureValues())).toEqual([]);
  });

  it("fails when the schema gains a value without a definition", () => {
    const values = schemaFeatureValues();
    const grown = { ...values, "sleeve.type": [...values["sleeve.type"], "raglan"] };
    expect(catalogueDrift(FEATURE_DEFINITIONS, grown)).toEqual(["missing sleeve.type=raglan"]);
    expect(() => buildCataloguePrompt(FEATURE_DEFINITIONS, grown)).toThrow(/out of sync/);
  });

  it("fails when a definition has no schema value", () => {
    const values = schemaFeatureValues();
    const shrunk = { ...values, belt: ["none"] };
    expect(catalogueDrift(FEATURE_DEFINITIONS, shrunk)).toEqual(["unknown belt=self-tie"]);
  });

  it("lists every value and the length limits", () => {
    const prompt = buildCataloguePrompt();
    expect(prompt).toContain("  - circle-half: ");
    expect(prompt).toContain("  - skirt.lengthMm: ");
  });

  it("puts the catalogue in both system prompts", () => {
    expect(analyzeSystemPrompt()).toContain("Allowed feature values:");
    expect(chatSystemPrompt()).toContain("Allowed feature values:");
  });
});
