/** Scorer tests on hand-made labels (issue #338): every rule of decision 338 to the exact fraction. */
import type { DesignAnalysisResult, DesignSpec } from "@tafsila/schemas";
import { dartedBlouse, straightKneeSkirt, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import type { EvalLabel } from "./labels";
import {
  ABSENT,
  confidenceCheck,
  confusions,
  contentWords,
  featureValue,
  macroAccuracy,
  ratio,
  scorePhoto,
  tally,
  unsupportedMatched,
} from "./score";

/**
 * A label for a design.
 *
 * @param spec - The labelled design.
 * @param id - The label id.
 * @returns The label.
 */
function label(spec: DesignSpec, id = "p1"): EvalLabel {
  return { id, photo: `${id}.jpg`, category: spec.category, spec, unsupported: [] };
}

/**
 * An analysis that answers a design, sure of everything unless told otherwise.
 *
 * @param spec - The answered design.
 * @param confidence - Per-feature confidence.
 * @returns The analysis.
 */
function analysis(
  spec: DesignSpec,
  confidence: DesignAnalysisResult["confidence"] = {},
): DesignAnalysisResult {
  return {
    spec,
    category: { value: spec.category, confidence: 0.9 },
    confidence,
    notes: [],
    unsupported: [],
  };
}

describe("scorePhoto", () => {
  it("scores a perfect dress answer 15/15 (slit, pockets and belt absent in both are not counted)", () => {
    const scores = scorePhoto(label(vNeckHalfCircleDress), analysis(vNeckHalfCircleDress));
    expect(tally(scores)).toEqual({ compared: 15, correct: 15, accuracy: 1 });
    expect(scores.map((score) => score.path)).not.toContain("waistband");
  });

  it("counts one wrong enum as exactly one miss", () => {
    const answer = {
      ...vNeckHalfCircleDress,
      neckline: { ...vNeckHalfCircleDress.neckline!, front: "round" as const },
    };
    const scores = scorePhoto(label(vNeckHalfCircleDress), analysis(answer));
    expect(tally(scores)).toEqual({ compared: 15, correct: 14, accuracy: 14 / 15 });
    expect(scores.find((score) => !score.correct)).toMatchObject({
      path: "neckline.front",
      expected: "v",
      predicted: "round",
    });
  });

  it("counts a feature the label has and the model left out as wrong", () => {
    const pocketDress = { ...vNeckHalfCircleDress, pockets: ["side-seam" as const] };
    const scores = scorePhoto(label(pocketDress), analysis(vNeckHalfCircleDress));
    expect(tally(scores)).toEqual({ compared: 16, correct: 15, accuracy: 15 / 16 });
    expect(scores.find((score) => score.path === "pockets")).toMatchObject({
      predicted: undefined,
      correct: false,
    });
  });

  it("counts a waistband the model invented as wrong, and a 'none' waistband as absent", () => {
    const invented = { ...straightKneeSkirt, waistband: "straight" as const };
    expect(tally(scorePhoto(label(straightKneeSkirt), analysis(invented)))).toEqual({
      compared: 7,
      correct: 6,
      accuracy: 6 / 7,
    });
    const noField: DesignSpec = { ...straightKneeSkirt };
    delete noField.waistband;
    expect(tally(scorePhoto(label(straightKneeSkirt), analysis(noField))).compared).toBe(6);
  });

  it("compares pockets as a set", () => {
    const labelled = { ...straightKneeSkirt, pockets: ["side-seam" as const, "patch" as const] };
    const answered = {
      ...straightKneeSkirt,
      pockets: ["patch" as const, "side-seam" as const, "patch" as const],
    };
    expect(tally(scorePhoto(label(labelled), analysis(answered))).accuracy).toBe(1);
    expect(featureValue(labelled, "pockets")).toBe("patch+side-seam");
  });

  it("skips features that do not apply to the label's category", () => {
    const paths = scorePhoto(label(dartedBlouse), analysis(dartedBlouse)).map((score) => score.path);
    expect(paths).toHaveLength(12);
    expect(paths.some((path) => path.startsWith("skirt"))).toBe(false);
    expect(paths).not.toContain("bodice.waistSeam");
  });

  it("makes every labelled feature wrong when the call failed", () => {
    const scores = scorePhoto(label(straightKneeSkirt), undefined);
    expect(tally(scores)).toEqual({ compared: 6, correct: 0, accuracy: 0 });
    expect(scores.every((score) => score.confidence === undefined)).toBe(true);
  });

  it("reads the slit position, and a wrong category leaves the label's parts unanswered", () => {
    const slit = {
      ...straightKneeSkirt,
      skirt: {
        type: "straight" as const,
        length: "knee" as const,
        slit: { position: "back" as const, lengthMm: 100 },
      },
    };
    expect(featureValue(slit, "skirt.slit")).toBe("back");
    expect(featureValue(straightKneeSkirt, "skirt.slit")).toBeUndefined();
    const scores = scorePhoto(label(dartedBlouse), analysis(straightKneeSkirt));
    expect(scores.find((score) => score.path === "bodice.fit")).toMatchObject({
      predicted: undefined,
      correct: false,
    });
  });
});

describe("tally", () => {
  it("gives micro and macro figures that differ on an uneven example", () => {
    const perfect = scorePhoto(label(vNeckHalfCircleDress), analysis(vNeckHalfCircleDress));
    const failed = scorePhoto(label(straightKneeSkirt), undefined);
    expect(tally([...perfect, ...failed]).accuracy).toBeCloseTo(15 / 21, 10);
    expect(macroAccuracy([perfect, failed])).toBeCloseTo(0.5, 10);
    expect(macroAccuracy([[], []])).toBeNull();
    expect(tally([])).toEqual({ compared: 0, correct: 0, accuracy: null });
    expect(ratio(1, 0)).toBeNull();
  });
});

describe("confusions", () => {
  it("lists the most common wrong answers first and writes absent values", () => {
    const answer = {
      ...vNeckHalfCircleDress,
      neckline: { ...vNeckHalfCircleDress.neckline!, front: "round" as const },
    };
    const scores = [
      ...scorePhoto(label(vNeckHalfCircleDress, "a"), analysis(answer)),
      ...scorePhoto(label(vNeckHalfCircleDress, "b"), analysis(answer)),
      ...scorePhoto(label(straightKneeSkirt, "c"), undefined),
    ];
    const list = confusions(scores);
    expect(list[0]).toEqual({ path: "neckline.front", expected: "v", predicted: "round", count: 2 });
    expect(list[1]).toEqual({ path: "category", expected: "skirt", predicted: ABSENT, count: 1 });
    expect(list).toHaveLength(7);
    expect(confusions(scores, 3)).toHaveLength(3);
  });
});

describe("confidenceCheck", () => {
  it("measures the low-confidence flag: two wrong flagged, one wrong sure gives recall 2/3", () => {
    const answer: DesignSpec = {
      ...vNeckHalfCircleDress,
      neckline: { front: "round", back: "v", collar: "none" },
      sleeve: { type: "puff", length: "short", cuff: "none" },
    };
    const scores = scorePhoto(
      label(vNeckHalfCircleDress),
      analysis(answer, { "neckline.front": 0.4, "neckline.back": 0.5, "sleeve.length": 0.3 }),
    );
    const check = confidenceCheck([...scores, ...scorePhoto(label(straightKneeSkirt), undefined)]);
    expect(check).toMatchObject({ wrong: 3, wrongFlagged: 2, flagRecall: 2 / 3 });
    expect(check.low).toEqual({ compared: 3, correct: 1, accuracy: 1 / 3 });
    expect(check.high).toEqual({ compared: 12, correct: 11, accuracy: 11 / 12 });
  });

  it("uses the category's own confidence when the map has none", () => {
    const result = { ...analysis(dartedBlouse), category: { value: "blouse" as const, confidence: 0.2 } };
    const category = scorePhoto(label(dartedBlouse), result).find((score) => score.path === "category");
    expect(category?.confidence).toBeCloseTo(0.2, 10);
  });
});

describe("unsupportedMatched", () => {
  it("matches the same idea in other word forms", () => {
    expect(unsupportedMatched("puff sleeve", ["Puffed sleeves are not supported yet."])).toBe(true);
    expect(contentWords("Puffed sleeves")).toEqual(new Set(["puff", "sleeve"]));
  });

  it("does not match unrelated text or an empty label", () => {
    expect(unsupportedMatched("puff sleeve", ["lace trim on the hem"])).toBe(false);
    expect(unsupportedMatched("a", ["anything"])).toBe(false);
    expect(unsupportedMatched("dress", [])).toBe(false);
  });
});
