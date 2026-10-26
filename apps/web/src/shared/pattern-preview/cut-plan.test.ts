import { cutSteps, generatePattern } from "@tafsila/engine";
import { SIZE_MATRIX, seedDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { toCutPlan } from "./cut-plan";

const SIZE_M = SIZE_MATRIX.find((entry) => entry.id === "size-m")!;
const TOLERANCE_MM = 1;

describe("toCutPlan", () => {
  const result = generatePattern(seedDress, SIZE_M.measurements);
  const plan = toCutPlan(cutSteps(result), result.pieces);

  it("keeps the engine version, the curve step and every piece", () => {
    expect(plan.engineVersion).toBe(result.engineVersion);
    expect(plan.curveStepMm).toBe(25);
    expect(plan.pieces.map((p) => p.pieceId)).toEqual(result.pieces.map((p) => p.id));
  });

  it("numbers the steps from 1 without gaps and leaves the reference steps out", () => {
    for (const piece of plan.pieces) {
      expect(piece.steps.map((s) => s.no)).toEqual(piece.steps.map((_, i) => i + 1));
      expect(piece.reference.text.ar.length).toBeGreaterThan(0);
      expect(new Set(piece.steps.map((s) => s.id)).size).toBe(piece.steps.length);
    }
  });

  it("gives both languages and Western digits in every step", () => {
    for (const step of plan.pieces.flatMap((p) => p.steps)) {
      expect(step.text.ar.length).toBeGreaterThan(0);
      expect(step.text.en.length).toBeGreaterThan(0);
      expect(step.text.ar).not.toMatch(/[٠-٩]/);
    }
  });

  it("only refers to points that exist, inside the diagram box", () => {
    for (const piece of plan.pieces) {
      const ids = new Set(piece.points.map((p) => p.id));
      for (const step of piece.steps) for (const id of step.pointIds) expect(ids.has(id)).toBe(true);
      for (const point of piece.points) {
        expect(point.at.x).toBeGreaterThanOrEqual(-TOLERANCE_MM);
        expect(point.at.y).toBeGreaterThanOrEqual(-TOLERANCE_MM);
        expect(point.at.x).toBeLessThanOrEqual(piece.diagram.widthMm + TOLERANCE_MM);
        expect(point.at.y).toBeLessThanOrEqual(piece.diagram.heightMm + TOLERANCE_MM);
      }
      expect(piece.diagram.outlineD.startsWith("M")).toBe(true);
    }
  });

  it("is plain JSON, so it can cross the worker boundary", () => {
    expect(JSON.parse(JSON.stringify(plan))).toEqual(plan);
  });
});
