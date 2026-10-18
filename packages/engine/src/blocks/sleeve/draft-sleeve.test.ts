/** Unit tests of the set-in sleeve block (issue #134): key points, lengths, cap ease, edges, notches, errors, purity. */
import type { Measurements } from "@tafsila/schemas";
import { egyptianSizeChart, referenceDrafts, REFERENCE_SIZES } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import {
  SLEEVE_CAP_LENGTH_BELOW_UNDERARM_MM,
  SLEEVE_CAP_TARGET_EASE_MM,
  SLEEVE_LENGTH_SHARE,
  SLEEVE_SHORT_BELOW_UNDERARM_MM,
} from "../../constants/sleeve-block";
import { DraftingError } from "../../errors/drafting-error";
import { isClosed, pathLength } from "../../geometry";
import { edgeLengthMm } from "../../pieces/measure";
import { solveSleeveCapHeight } from "../../sleeve/sleeve-cap";
import { deepFreeze } from "../../test-utils/deep-freeze";
import { sleeveCase } from "../../test-utils/sleeve-input";
import { draftSleeve, elbowYMm, sleeveHemYMm } from "./draft-sleeve";
import { SLEEVE_EDGE, SLEEVE_NOTCH } from "./ids";
import { backArmholeNotches, frontArmholeNotches } from "./notches";
import type { SleeveLength } from "./types";

/** NFR-01 tolerance. */
const KEY_POINT_MM = 1;

/** Every length option. */
const LENGTHS: readonly SleeveLength[] = ["cap", "short", "elbow", "three-quarter", "long"];

const M = egyptianSizeChart.M as Measurements;

/** Reference points the engine meets as drafted; the underarm height is solved instead (decision 134, 1). */
const FIXED_POINTS = [
  "sleeve.capTop",
  "sleeve.wristBack",
  "sleeve.wristFront",
  "sleeve.wristCentre",
] as const;

describe("draftSleeve key points", () => {
  it.each(REFERENCE_SIZES)("size %s matches the reference points (± 1 mm)", (size) => {
    const input = sleeveCase(egyptianSizeChart[size] as Measurements);
    const { keyPoints, capHeightMm } = draftSleeve(input);
    const ref = referenceDrafts[size].sleeve;
    for (const name of FIXED_POINTS) {
      expect(Math.abs(keyPoints[name].x - ref[name]!.x), `${name}.x`).toBeLessThanOrEqual(KEY_POINT_MM);
      expect(Math.abs(keyPoints[name].y - ref[name]!.y), `${name}.y`).toBeLessThanOrEqual(KEY_POINT_MM);
    }
    for (const name of ["sleeve.underarmBack", "sleeve.underarmFront"] as const) {
      expect(Math.abs(keyPoints[name].x - ref[name]!.x), `${name}.x`).toBeLessThanOrEqual(KEY_POINT_MM);
      expect(keyPoints[name].y, `${name}.y is the solved cap height`).toBe(capHeightMm);
    }
  });

  it("solves the cap height with the shared bisection solver for the target ease", () => {
    const input = sleeveCase(M);
    const expected = solveSleeveCapHeight({
      armholeLengthMm: input.armholeBackMm + input.armholeFrontMm,
      bicepWidthMm: input.bicepHalfMm * 2,
      capEaseMm: SLEEVE_CAP_TARGET_EASE_MM,
    });
    expect(draftSleeve(input).capHeightMm).toBe(expected);
  });

  it("splits the cap ease between back and front in proportion to their armholes", () => {
    const input = sleeveCase(M);
    const { capEaseMm } = draftSleeve(input);
    const backShare = input.armholeBackMm / (input.armholeBackMm + input.armholeFrontMm);
    expect(Math.abs(capEaseMm.total - SLEEVE_CAP_TARGET_EASE_MM)).toBeLessThan(0.5);
    expect(capEaseMm.back / capEaseMm.total).toBeCloseTo(backShare, 3);
    expect(capEaseMm.back + capEaseMm.front).toBeCloseTo(capEaseMm.total, 6);
  });
});

describe("sleeve lengths", () => {
  it("puts each hem at its named distance", () => {
    const capHeightMm = 180;
    const armLengthMm = 575;
    expect(sleeveHemYMm("cap", capHeightMm, armLengthMm)).toBe(
      capHeightMm + SLEEVE_CAP_LENGTH_BELOW_UNDERARM_MM,
    );
    expect(sleeveHemYMm("short", capHeightMm, armLengthMm)).toBe(
      capHeightMm + SLEEVE_SHORT_BELOW_UNDERARM_MM,
    );
    expect(sleeveHemYMm("elbow", capHeightMm, armLengthMm)).toBe(elbowYMm(armLengthMm));
    expect(sleeveHemYMm("three-quarter", capHeightMm, armLengthMm)).toBeCloseTo(
      armLengthMm * SLEEVE_LENGTH_SHARE.threeQuarter,
      6,
    );
    expect(sleeveHemYMm("long", capHeightMm, armLengthMm)).toBe(armLengthMm);
  });

  it("keeps the lengths in order and the hem on the underarm seam lines", () => {
    const hems = LENGTHS.map((length) => draftSleeve(sleeveCase(M, length)));
    const ys = hems.map((d) => d.hemYMm);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    for (const d of hems) {
      expect(d.keyPoints["sleeve.hemFront"].y).toBe(d.hemYMm);
      expect(d.keyPoints["sleeve.hemBack"].x).toBe(-d.keyPoints["sleeve.hemFront"].x);
    }
  });

  it("rejects a hem too close to the underarm line", () => {
    expect(() => sleeveHemYMm("elbow", 200, 300)).toThrow(
      expect.objectContaining({ code: "SLEEVE_LENGTH_TOO_SHORT" }),
    );
  });

  it("rejects an armhole no cap can fit", () => {
    const input = { ...sleeveCase(M), armholeBackMm: 1000, armholeFrontMm: 1000 };
    expect(() => draftSleeve(input)).toThrow(DraftingError);
    expect(() => draftSleeve(input)).toThrow(expect.objectContaining({ code: "SLEEVE_CAP_UNSOLVABLE" }));
  });
});

describe("sleeve piece", () => {
  const draft = draftSleeve(sleeveCase(M, "short"));
  const { piece } = draft;

  it("is a closed outline cut as a mirrored pair with the grain on the centre line", () => {
    expect(isClosed(piece.stitchPath)).toBe(true);
    expect(piece.cut).toEqual({ quantity: 2, onFold: false, mirror: true, fabric: "main" });
    expect(piece.grainLine.every((p) => p.x === 0)).toBe(true);
    expect(piece.grainLine[1].y).toBeLessThan(draft.hemYMm);
  });

  it("has the five edges in path order covering the whole outline", () => {
    expect(piece.edges.map((e) => e.id)).toEqual(Object.values(SLEEVE_EDGE));
    expect(piece.edges.at(-1)!.toSegment).toBe(piece.stitchPath.length - 1);
    const total = piece.edges.reduce((sum, e) => sum + edgeLengthMm(piece, e.id), 0);
    expect(total).toBeCloseTo(pathLength(piece.stitchPath), 6);
  });

  it("declares the cap against both bodice armholes", () => {
    expect(piece.sleeveCap).toEqual({
      edgeIds: ["cap-back", "cap-front"],
      armholeRefs: [
        { pieceId: "bodice-back", edgeId: "armhole" },
        { pieceId: "bodice-front", edgeId: "armhole" },
      ],
    });
  });

  it("makes both underarm seam halves the same length", () => {
    const back = edgeLengthMm(piece, SLEEVE_EDGE.underarmBack);
    const front = edgeLengthMm(piece, SLEEVE_EDGE.underarmFront);
    expect(Math.abs(back - front)).toBeLessThanOrEqual(2);
  });

  it("starts the front cap edge at the shoulder point", () => {
    const capFront = piece.edges.find((e) => e.id === SLEEVE_EDGE.capFront)!;
    expect(piece.stitchPath[capFront.fromSegment]!.from).toEqual(draft.keyPoints["sleeve.shoulderPoint"]);
  });
});

describe("balance notches", () => {
  const input = sleeveCase(M);
  const { piece } = draftSleeve(input);
  const ids = (notches: readonly { id: string }[]) =>
    notches.map((n) => n.id).sort((a, b) => a.localeCompare(b, "en"));

  it("uses the same ids on the sleeve and on the bodice armholes", () => {
    const bodice = [...backArmholeNotches(input.armholeBackMm), ...frontArmholeNotches(input.armholeFrontMm)];
    expect(ids(piece.notches)).toEqual(ids(bodice));
    expect(ids(piece.notches)).toEqual(
      [...Object.values(SLEEVE_NOTCH)].sort((a, b) => a.localeCompare(b, "en")),
    );
  });

  it("puts a double notch at the back and a single one at the front", () => {
    const on = (edgeId: string) => piece.notches.filter((n) => n.edgeId === edgeId && n.id !== "shoulder");
    expect(on(SLEEVE_EDGE.capBack)).toHaveLength(2);
    expect(on(SLEEVE_EDGE.capFront)).toHaveLength(1);
  });

  it("puts every bodice notch inside its armhole", () => {
    for (const n of backArmholeNotches(input.armholeBackMm)) {
      expect(n.atMm).toBeGreaterThan(0);
      expect(n.atMm).toBeLessThan(input.armholeBackMm);
    }
    for (const n of frontArmholeNotches(input.armholeFrontMm)) {
      expect(n.atMm).toBeGreaterThanOrEqual(0);
      expect(n.atMm).toBeLessThan(input.armholeFrontMm);
    }
  });
});

describe("purity", () => {
  it("returns the same sleeve for the same frozen input", () => {
    const input = deepFreeze(sleeveCase(M, "elbow"));
    expect(draftSleeve(input)).toEqual(draftSleeve(input));
  });
});
