import { describe, expect, it } from "vitest";
import type { PieceDraft } from "../pipeline/draft-context";
import { coverageOf } from "./coverage";
import { parseRef } from "./refs";

/** Two pieces with one seam between them, plus a self-paired edge. */
const PIECES = [
  {
    id: "a",
    darts: [],
    edges: [
      { id: "side", pairsWith: { pieceId: "b", edgeId: "side" } },
      { id: "cb", pairsWith: { pieceId: "a", edgeId: "cb" } },
    ],
  },
  { id: "b", darts: [], edges: [{ id: "side", pairsWith: { pieceId: "a", edgeId: "side" } }] },
] as unknown as PieceDraft[];

/**
 * Builds a step.
 *
 * @param action - The kind of work.
 * @param edges - The references.
 * @returns The step.
 */
const step = (action: "sew" | "press" | "attach", ...edges: string[]) => ({
  order: 1,
  action,
  edges,
  text: { ar: "x", en: "x" },
});

describe("sewing coverage", () => {
  it("accepts one step per seam, a self pair counted once", () => {
    const steps = [step("sew", "a/side", "b/side"), step("sew", "a/cb")];
    expect(coverageOf(PIECES, steps).ok).toBe(true);
  });

  it("reports an unsewn seam, and ignores press steps", () => {
    const result = coverageOf(PIECES, [step("press", "a/side", "b/side"), step("sew", "a/cb")]);
    expect(result.uncovered).toEqual(["a/side|b/side"]);
  });

  it("reports a seam sewn twice", () => {
    const steps = [step("sew", "a/side", "b/side"), step("attach", "a/side", "b/side"), step("sew", "a/cb")];
    expect(coverageOf(PIECES, steps).duplicated).toEqual(["a/side|b/side"]);
  });

  it("parses the three reference forms", () => {
    expect(parseRef("a/side")).toEqual({ pieceId: "a", edgeId: "side" });
    expect(parseRef("a/dart:bust-dart")).toEqual({ pieceId: "a", dartId: "bust-dart" });
    expect(parseRef("a")).toEqual({ pieceId: "a" });
  });
});
