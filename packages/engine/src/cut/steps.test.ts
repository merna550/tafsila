import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { pt } from "../geometry";
import { rectanglePiece } from "../test-utils/cut-piece";
import { cutSteps } from "./index";
import { pieceCutSteps, pointLabel } from "./steps";

/**
 * A pattern holding one piece, as `cutSteps` reads it.
 *
 * @param piece - The piece; a plain rectangle when left out.
 * @returns The pattern parts `cutSteps` reads.
 */
const pattern = (piece = rectanglePiece()) => ({ engineVersion: "1.2.3", pieces: [piece as never] });

describe("pointLabel", () => {
  it("counts A..Z, then AA, AB.., then BA", () => {
    expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(pointLabel)).toEqual([
      "A",
      "B",
      "Z",
      "AA",
      "AB",
      "AZ",
      "BA",
      "ZZ",
      "AAA",
    ]);
  });
});

describe("pieceCutSteps (issue #284, FR-CUT-01)", () => {
  const piece = rectanglePiece({
    notches: [
      { id: "n1", edgeId: "right", atMm: 100 },
      { id: "n2", edgeId: "top", atMm: 50, marks: 2 },
      { id: "n3", edgeId: "missing", atMm: 5 },
    ],
    darts: [{ id: "d1", edgeId: "bottom", apex: pt(100, 200), legs: [pt(110, 300), pt(90, 300)] }],
  });
  const result = pieceCutSteps(piece, 25);

  it("numbers the steps 1..N without gaps and keeps labels unique", () => {
    expect(result.steps.map((s) => s.n)).toEqual(result.steps.map((_, i) => i + 1));
    const labels = result.points.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("starts with the grain reference and the top line, then the top-left corner", () => {
    expect(result.steps.slice(0, 3).map((s) => s.key)).toEqual([
      "cut.reference.grain",
      "cut.reference.top",
      "cut.mark.corner",
    ]);
    expect(result.points[0]).toMatchObject({ label: "A", alongMm: 0, acrossMm: 0 });
  });

  it("walks the top edge first and closes the outline back to A", () => {
    expect(result.points[1]).toMatchObject({ kind: "corner", alongMm: 0, acrossMm: 200 });
    const connections = result.steps.filter((s) => s.key === "cut.connect.straight");
    expect(connections.map((s) => [s.params["from"], s.params["to"]])).toEqual([
      ["A", "B"],
      ["B", "C"],
      ["C", "D"],
      ["D", "A"],
    ]);
  });

  it("marks each notch on a real edge, and one dart with three points", () => {
    expect(result.steps.filter((s) => s.key === "cut.mark.notch")).toHaveLength(2);
    expect(result.steps.filter((s) => s.key === "cut.mark.dart")).toHaveLength(3);
    const dart = result.steps.filter((s) => s.key === "cut.connect.dart");
    expect(dart).toHaveLength(1);
    expect(dart[0]!.points).toHaveLength(3);
    const notch = result.points.find((p) => p.kind === "notch")!;
    expect(notch).toMatchObject({ alongMm: 100, acrossMm: 200 });
  });

  it("ends with the grain line and the cut, carrying the piece's quantity", () => {
    expect(result.steps.at(-2)!.key).toBe("cut.connect.grain");
    expect(result.steps.at(-1)).toMatchObject({
      key: "cut.cut",
      params: { quantity: 2, onFold: 0, mirror: 1, fabric: "main" },
    });
  });

  it("does not draw along the fold of a fold piece", () => {
    const folded = pieceCutSteps(rectanglePiece({ fold: true }), 25);
    expect(folded.steps[0]!.key).toBe("cut.reference.fold");
    const connections = folded.steps.filter((s) => s.key === "cut.connect.straight");
    expect(connections).toHaveLength(3);
    expect(folded.steps.at(-1)!.params).toMatchObject({ onFold: 1, mirror: 0 });
  });
});

describe("cutSteps", () => {
  it("defaults to a 25 mm curve step and carries the engine version", () => {
    const result = cutSteps(pattern());
    expect(result).toMatchObject({ engineVersion: "1.2.3", curveStepMm: 25 });
    expect(result.pieces).toHaveLength(1);
  });

  it.each([19, 31, Number.NaN])("throws CUT_STEP_OUT_OF_RANGE for a %s mm step", (curveStepMm) => {
    expect(() => cutSteps(pattern(), { curveStepMm })).toThrow(DraftingError);
    try {
      cutSteps(pattern(), { curveStepMm });
    } catch (error) {
      expect((error as DraftingError).code).toBe("CUT_STEP_OUT_OF_RANGE");
    }
  });

  it("accepts 20 and 30 mm", () => {
    expect(cutSteps(pattern(), { curveStepMm: 20 }).curveStepMm).toBe(20);
    expect(cutSteps(pattern(), { curveStepMm: 30 }).curveStepMm).toBe(30);
  });

  it("gives no pieces for a failed result", () => {
    expect(cutSteps({ engineVersion: "1.2.3", pieces: [] }).pieces).toEqual([]);
  });
});
