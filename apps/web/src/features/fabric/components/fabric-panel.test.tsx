import type { RecommendFabricsResponse } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { FabricRecommendationsView } from "./FabricRecommendationsView";

const reason = (ar: string, en: string) => ({ ar, en });
const fabric = (id: string, nameAr: string, nameEn: string) => ({
  id,
  nameAr,
  nameEn,
  properties: { drape: 4, weight: 2, body: 1, stretch: 0, sheen: 3 },
});

const DATA: RecommendFabricsResponse = {
  recommended: [
    {
      fabricId: "crepe",
      score: 9,
      reason: reason("ينسدل بنعومة", "Drapes softly"),
      fabric: fabric("crepe", "كريب", "Crepe"),
    },
    {
      fabricId: "satin",
      score: 8,
      reason: reason("حركة ممتازة", "Great movement"),
      fabric: fabric("satin", "ساتان", "Satin"),
    },
    {
      fabricId: "chiffon",
      score: 7,
      reason: reason("خفيف جداً", "Very light"),
      fabric: fabric("chiffon", "شيفون", "Chiffon"),
    },
  ],
  avoid: [
    {
      fabricId: "denim",
      ruleId: "r1",
      reason: reason("ثقيل وجامد", "Heavy and stiff"),
      fabric: fabric("denim", "دنيم", "Denim"),
    },
  ],
  isDraft: true,
};

describe("FabricRecommendationsView", () => {
  it("shows one card per fabric with its reason and property labels, in Arabic", () => {
    const html = renderWithIntl(<FabricRecommendationsView data={DATA} />, "ar");
    for (const text of ["كريب", "ساتان", "شيفون", "ينسدل بنعومة", "التدلّي", "اللمعان", "الأنسب"]) {
      expect(html).toContain(text);
    }
  });

  it("shows the English names and reasons in English", () => {
    const html = renderWithIntl(<FabricRecommendationsView data={DATA} />, "en");
    for (const text of ["Crepe", "Drapes softly", "Drape", "Best fit", "Very high"]) {
      expect(html).toContain(text);
    }
  });

  it("marks only the first card as the best fit", () => {
    expect(renderWithIntl(<FabricRecommendationsView data={DATA} />, "en").match(/Best fit/g)).toHaveLength(
      1,
    );
  });

  it("lists the avoided fabrics with their reasons", () => {
    const html = renderWithIntl(<FabricRecommendationsView data={DATA} />, "en");
    expect(html).toContain("Better avoided");
    expect(html).toContain("Denim");
    expect(html).toContain("Heavy and stiff");
  });

  it("leaves out the avoid card when the list is empty", () => {
    const html = renderWithIntl(<FabricRecommendationsView data={{ ...DATA, avoid: [] }} />, "en");
    expect(html).not.toContain("Better avoided");
  });

  it("shows the draft note only while the data is a draft", () => {
    expect(renderWithIntl(<FabricRecommendationsView data={DATA} />, "en")).toContain("fabric-draft-note");
    const reviewed = renderWithIntl(<FabricRecommendationsView data={{ ...DATA, isDraft: false }} />, "en");
    expect(reviewed).not.toContain("fabric-draft-note");
  });
});
