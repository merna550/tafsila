/** Tests for the fabric explanation with the fake provider and scripted test models (issue #346). */
import { aLineMidiSkirt } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { AiOutputInvalidError } from "./errors";
import { countWords, fabricsNamedOutside, MAX_EXPLANATION_WORDS } from "./explain-check";
import {
  explainPrompt,
  explainRecommendations,
  type ExplainRecommendationsInput,
} from "./explain-recommendations";
import { createFakeAi } from "./index";
import { scriptedDeps, scriptedModel } from "./test-models";

const crepe = {
  id: "crepe",
  nameAr: "كريب",
  nameEn: "Crepe",
  reason: { ar: "ينسدل بنعومة", en: "Drapes softly" },
};
const satin = {
  id: "satin",
  nameAr: "ساتان",
  nameEn: "Satin",
  reason: { ar: "تدلٍّ ممتاز", en: "Excellent drape" },
};
const denim = {
  id: "denim",
  nameAr: "دنيم",
  nameEn: "Denim",
  reason: { ar: "ثقيل وجامد", en: "Heavy and stiff" },
};
const poplin = { id: "cotton-poplin", nameAr: "قطن بوبلين", nameEn: "Cotton poplin" };
const cotton = { id: "cotton", nameAr: "قطن", nameEn: "Cotton" };
const catalogue = [crepe, satin, denim, poplin, cotton, { id: "lace", nameAr: "دانتيل", nameEn: "Lace" }];

/**
 * A request for the two fabrics, with denim to avoid.
 *
 * @param locale - Language of the paragraph.
 * @returns The input.
 */
function input(locale: "ar" | "en" = "en"): ExplainRecommendationsInput {
  return { spec: aLineMidiSkirt, recommended: [crepe, satin], avoid: [denim], catalogue, locale };
}

describe("explainRecommendations", () => {
  it("explains in English with the fake provider, naming only given fabrics", async () => {
    const { text, usage } = await explainRecommendations(input("en"), createFakeAi());
    expect(text).toContain("Crepe");
    expect(text).toContain("Satin");
    expect(fabricsNamedOutside(text, [crepe, satin, denim], catalogue)).toEqual([]);
    expect(usage.attempts).toBe(1);
  });

  it("explains in Arabic with the fake provider", async () => {
    const { text } = await explainRecommendations(input("ar"), createFakeAi());
    expect(text).toContain("كريب");
    expect(text).toContain("ساتان");
  });

  it("puts every reason and no outside fabric in the prompt", async () => {
    const model = scriptedModel([{ text: "Crepe and Satin drape well." }]);
    await explainRecommendations(input("en"), scriptedDeps(model));
    const prompt = JSON.stringify(model.doGenerateCalls[0]!.prompt);
    for (const reason of ["Drapes softly", "Excellent drape", "Heavy and stiff"])
      expect(prompt).toContain(reason);
    for (const outside of ["Lace", "Cotton poplin", "دانتيل"]) expect(prompt).not.toContain(outside);
    expect(explainPrompt(input("ar"))).toContain("ينسدل بنعومة");
  });

  it("retries once when the text names a fabric outside the input", async () => {
    const model = scriptedModel([{ text: "Lace is also lovely." }, { text: "Crepe drapes well." }]);
    const { text, usage } = await explainRecommendations(input("en"), scriptedDeps(model));
    expect(text).toBe("Crepe drapes well.");
    expect(usage.attempts).toBe(2);
    expect(JSON.stringify(model.doGenerateCalls[1]!.prompt)).toContain("not in the list");
  });

  it("throws after two bad texts, carrying the usage", async () => {
    const model = scriptedModel([{ text: "Lace." }, { text: "دانتيل جميل" }]);
    const error = await explainRecommendations(input("ar"), scriptedDeps(model)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AiOutputInvalidError);
    expect((error as AiOutputInvalidError).usage?.attempts).toBe(2);
  });

  it("rejects a text over the word limit", async () => {
    const long = Array.from({ length: MAX_EXPLANATION_WORDS + 1 }, () => "word").join(" ");
    const model = scriptedModel([{ text: long }, { text: "Crepe." }]);
    const { text } = await explainRecommendations(input("en"), scriptedDeps(model));
    expect(text).toBe("Crepe.");
  });

  it("rejects an empty text", async () => {
    const model = scriptedModel([{ text: "  " }, { text: "" }]);
    await expect(explainRecommendations(input("en"), scriptedDeps(model))).rejects.toThrow(/empty/);
  });
});

describe("fabricsNamedOutside", () => {
  const allowed = [crepe, satin];

  it("finds an Arabic name with a prefix and spelling variants", () => {
    expect(fabricsNamedOutside("ويناسب الدانتيل", allowed, catalogue)).toEqual(["lace"]);
    expect(fabricsNamedOutside("دَانتِيل", allowed, catalogue)).toEqual(["lace"]);
  });

  it("does not take a longer allowed name for the shorter one inside it", () => {
    const withPoplin = [crepe, poplin];
    expect(fabricsNamedOutside("Cotton poplin is crisp", withPoplin, catalogue)).toEqual([]);
    expect(fabricsNamedOutside("Cotton is crisp", withPoplin, catalogue)).toEqual(["cotton"]);
  });

  it("ignores a name inside a longer word", () => {
    expect(fabricsNamedOutside("Crepeless laceration", allowed, catalogue)).toEqual([]);
  });

  it("counts words", () => {
    expect(countWords(" a  b\nc ")).toBe(3);
  });
});
