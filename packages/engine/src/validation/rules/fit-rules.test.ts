/** Focused pass/fail fixtures for the five fit-validation requirements in issue #133. */
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { VALIDATION_TEST_OPTIONS, validationContext, validationPiece } from "../test-support";
import { circumferenceRule } from "./circumference";
import { dartApexRule, dartLegRule } from "./darts";
import { notchAlignmentRule } from "./notches";
import { seamMatchRule } from "./seam-match";
import { sleeveCapRule } from "./sleeve-cap";

describe("FR-VAL-01 paired seams", () => {
  it("reports measured pass and fail differences", () => {
    const paired = (heightMm: number) =>
      validationPiece({
        id: "back",
        stitchPath: validationPiece().stitchPath.map((segment) => segment),
        edges: validationPiece().edges.map((edge) =>
          edge.id === "side" ? { ...edge, pairsWith: { pieceId: "front", edgeId: "side" } } : edge,
        ),
        ...(heightMm === 200
          ? {}
          : {
              stitchPath: [
                { kind: "line", from: { x: 0, y: 0 }, to: { x: 100, y: 0 } },
                { kind: "line", from: { x: 100, y: 0 }, to: { x: 100, y: heightMm } },
                { kind: "line", from: { x: 100, y: heightMm }, to: { x: 0, y: heightMm } },
                { kind: "line", from: { x: 0, y: heightMm }, to: { x: 0, y: 0 } },
              ],
            }),
      });
    const front = validationPiece({
      id: "front",
      edges: validationPiece().edges.map((edge) =>
        edge.id === "side" ? { ...edge, pairsWith: { pieceId: "back", edgeId: "side" } } : edge,
      ),
    });
    const passing = seamMatchRule.runMany!(validationContext([paired(201), front]))[0]!;
    const failing = seamMatchRule.runMany!(validationContext([paired(203), front]))[0]!;
    expect(passing).toMatchObject({ status: "pass", measuredMm: 1, expectedMm: 0 });
    expect(failing).toMatchObject({ status: "fail", measuredMm: 3, expectedMm: 0 });
  });
});

describe("FR-VAL-02 sleeve cap", () => {
  it("accepts 20 mm ease and rejects 5 mm ease", () => {
    const armhole = (id: string) =>
      validationPiece({ id, edges: [{ ...validationPiece().edges[0]!, id: "armhole" }] });
    const sleeve = (widthMm: number) =>
      validationPiece({
        id: "sleeve",
        stitchPath: [
          { kind: "line", from: { x: 0, y: 0 }, to: { x: widthMm, y: 0 } },
          { kind: "line", from: { x: widthMm, y: 0 }, to: { x: widthMm, y: 200 } },
          { kind: "line", from: { x: widthMm, y: 200 }, to: { x: 0, y: 200 } },
          { kind: "line", from: { x: 0, y: 200 }, to: { x: 0, y: 0 } },
        ],
        edges: [{ ...validationPiece().edges[0]!, id: "cap" }],
        sleeveCap: {
          edgeIds: ["cap"],
          armholeRefs: [
            { pieceId: "front", edgeId: "armhole" },
            { pieceId: "back", edgeId: "armhole" },
          ],
        },
      });
    const run = (widthMm: number) =>
      sleeveCapRule.runMany!(validationContext([armhole("front"), armhole("back"), sleeve(widthMm)]))[0]!;
    expect(run(220)).toMatchObject({ status: "pass", measuredMm: 20 });
    expect(run(205)).toMatchObject({ status: "fail", measuredMm: 5 });
  });
});

describe("FR-VAL-03 circumference", () => {
  it("measures an edge with cut-on-fold multiplicity", () => {
    const inputs = resolveDraftInputs(vNeckHalfCircleDress, sizeM, VALIDATION_TEST_OPTIONS);
    const expectedMm = sizeM.bust + inputs.totalEaseMm.bust;
    const piece = (widthMm: number) =>
      validationPiece({
        cut: { quantity: 1, onFold: true, mirror: false, fabric: "main" },
        stitchPath: [
          { kind: "line", from: { x: 0, y: 0 }, to: { x: widthMm, y: 0 } },
          { kind: "line", from: { x: widthMm, y: 0 }, to: { x: widthMm, y: 200 } },
          { kind: "line", from: { x: widthMm, y: 200 }, to: { x: 0, y: 200 } },
          { kind: "line", from: { x: 0, y: 200 }, to: { x: 0, y: 0 } },
        ],
        edges: [{ ...validationPiece().edges[0]!, id: "bust" }],
        bodyLines: [{ id: "bodice-bust", measurement: "bust", kind: "edge", edgeId: "bust" }],
      });
    const run = (widthMm: number) => circumferenceRule.runMany!(validationContext([piece(widthMm)]))[0]!;
    expect(run(expectedMm / 2)).toMatchObject({ status: "pass", measuredMm: expectedMm, expectedMm });
    expect(run(expectedMm / 2 + 3)).toMatchObject({ status: "fail", measuredMm: expectedMm + 6, expectedMm });
  });
});

describe("FR-VAL-04 notches", () => {
  it("normalizes reversed paired edges before comparing distances", () => {
    const piece = (id: string, partner: string, atMm: number, reversed: boolean) =>
      validationPiece({
        id,
        edges: validationPiece().edges.map((edge) =>
          edge.id === "side" ? { ...edge, pairsWith: { pieceId: partner, edgeId: "side", reversed } } : edge,
        ),
        notches: [{ id: "waist", edgeId: "side", atMm }],
      });
    const run = (partnerAtMm: number) =>
      notchAlignmentRule.runMany!(
        validationContext([piece("front", "back", 50, true), piece("back", "front", partnerAtMm, true)]),
      )[0]!;
    expect(run(150)).toMatchObject({ status: "pass", measuredMm: 0 });
    expect(run(147)).toMatchObject({ status: "fail", measuredMm: 3 });
  });

  it("compares from the edge ends when the source notch aligns from its end (decision 134)", () => {
    const piece = (id: string, partner: string, atMm: number, alignFrom?: "end") =>
      validationPiece({
        id,
        notches: [
          {
            id: "balance",
            edgeId: "side",
            atMm,
            pairsWith: { pieceId: partner, edgeId: "side", ...(alignFrom ? { alignFrom } : {}) },
          },
        ],
      });
    const run = (partnerAtMm: number) =>
      notchAlignmentRule.runMany!(
        validationContext([piece("back", "front", 150, "end"), piece("front", "back", partnerAtMm, "end")]),
      )[0]!;
    expect(run(150)).toMatchObject({ status: "pass", measuredMm: 0 });
    expect(run(147)).toMatchObject({ status: "fail", measuredMm: 3 });
  });

  it("pairs multiple differently named notches in reversed sewing order", () => {
    const piece = (id: string, partner: string, notchIds: readonly string[]) =>
      validationPiece({
        id,
        edges: validationPiece().edges.map((edge) =>
          edge.id === "side"
            ? { ...edge, pairsWith: { pieceId: partner, edgeId: "side", reversed: true } }
            : edge,
        ),
        notches: [
          { id: notchIds[0]!, edgeId: "side", atMm: 40 },
          { id: notchIds[1]!, edgeId: "side", atMm: 160 },
        ],
      });
    const checks = notchAlignmentRule.runMany!(
      validationContext([
        piece("front", "back", ["front-upper", "front-lower"]),
        piece("back", "front", ["back-lower", "back-upper"]),
      ]),
    );

    expect(checks).toHaveLength(2);
    expect(checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "pass", measuredMm: 0 }),
        expect.objectContaining({ status: "pass", measuredMm: 0 }),
      ]),
    );
  });
});

describe("FR-VAL-07 darts", () => {
  it("reports unequal legs and a dart apex past its declared limit", () => {
    const piece = validationPiece({
      darts: [
        {
          id: "bust-dart",
          edgeId: "side",
          apex: { x: 8, y: 10 },
          legs: [
            { x: 0, y: 0 },
            { x: 20, y: 0 },
          ],
          bustPointLimit: { point: { x: 0, y: 10 }, axis: "x", direction: "positive", setbackMm: 10 },
        },
      ],
    });
    const context = validationContext([piece]);
    expect(dartLegRule.runMany!(context)[0]).toMatchObject({ status: "fail" });
    expect(dartApexRule.runMany!(context)[0]).toMatchObject({
      status: "fail",
      measuredMm: 8,
      expectedMm: 10,
    });
    expect(
      dartLegRule.runMany!(
        validationContext([validationPiece({ darts: [{ ...piece.darts[0]!, apex: { x: 10, y: 0 } }] })]),
      )[0],
    ).toMatchObject({ status: "pass", measuredMm: 0 });
  });
});
