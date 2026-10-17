import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { pathLength } from "../geometry";
import { DEFAULT_ENGINE_OPTIONS } from "../pipeline/generate-pattern";
import { createContext, type DraftContext, type PieceDraft } from "../pipeline/draft-context";
import { marksRegistry } from "../pipeline/test-support/marks-module";
import { polygonPiece, rectanglePoints } from "../pipeline/test-support/shapes";
import { dartStep } from "./darts";
import { defaultGrainLine, grainStep } from "./grain";
import { completeNotches, edgeLengthMm, notchStep, partnerAtMm } from "./notches";
import { PIECE_NAMES } from "../i18n/pieces";

/**
 * A context holding the given pieces.
 *
 * @param pieces - Pieces to put in.
 * @returns The context.
 */
function ctxWith(pieces: PieceDraft[]): DraftContext {
  const base = createContext(vNeckHalfCircleDress, sizeM, DEFAULT_ENGINE_OPTIONS);
  return { ...base, pieces };
}

/**
 * Two rectangles whose "e1" edges are paired, with one notch on the first.
 *
 * @param atMm - Distance of the notch from the start of its edge.
 * @param reversed - Whether the paired edges run in opposite directions.
 * @param widthB - Width of the second piece.
 * @returns The two pieces.
 */
function pairedPieces(atMm: number, reversed: boolean, widthB: number): PieceDraft[] {
  const a = polygonPiece("a", rectanglePoints(100, 400));
  const b = polygonPiece("b", rectanglePoints(widthB, 400));
  return [
    { ...a, notches: [{ id: "n", edgeId: "e1", atMm, pairsWith: { pieceId: "b", edgeId: "e1", reversed } }] },
    b,
  ];
}

describe("notches (FR-PAT-02, FR-VAL-04)", () => {
  it("writes the partner on the paired edge, copying marks", () => {
    const run = notchStep(
      marksRegistry.modulesFor(vNeckHalfCircleDress).reduce((c, m) => m.draft(c), ctxWith([])),
    );
    const back = run.pieces.find((p) => p.id === "back-panel")!;
    expect(back.notches.map((n) => [n.id, n.edgeId, n.atMm, n.marks])).toEqual([
      ["n1", "side", 280, undefined],
      ["n2", "side", 150, 2],
    ]);
    expect(back.notches[0]!.pairsWith).toEqual({ pieceId: "front-panel", edgeId: "side", reversed: true });
  });

  it("is idempotent and keeps a partner a module already wrote", () => {
    const pieces = pairedPieces(100, false, 100);
    const once = completeNotches(pieces);
    expect(completeNotches(once)).toEqual(once);
    const written = [pieces[0]!, { ...pieces[1]!, notches: [{ id: "n", edgeId: "e1", atMm: 7 }] }];
    expect(completeNotches(written)[1]!.notches).toHaveLength(1);
  });

  it("throws when the partner edge or piece does not exist", () => {
    const [a, b] = pairedPieces(100, false, 100);
    const noEdge = { ...b!, edges: [] };
    expect(() => completeNotches([a!, noEdge])).toThrow(DraftingError);
    expect(() => completeNotches([a!])).toThrow(
      expect.objectContaining({ code: "FINISHING_NOTCH_PARTNER_MISSING" }),
    );
  });

  it("keeps the same distance from the shared end (property, tolerance 0.01 mm)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 50, max: 600 }),
        fc.boolean(),
        (atMm, widthB, reversed) => {
          const [a, b] = completeNotches(pairedPieces(atMm, reversed, widthB));
          const partner = b!.notches[0]!;
          const edgeA = a!.edges[1]!;
          const edgeB = b!.edges[1]!;
          const lenA = edgeLengthMm(a!, edgeA);
          const lenB = edgeLengthMm(b!, edgeB);
          expect(lenA).toBeCloseTo(pathLength(a!.stitchPath.slice(1, 2)), 6);
          // distance from the shared end: the start of A's edge is the end of B's when reversed
          const fromSharedEndA = a!.notches[0]!.atMm;
          const fromSharedEndB = reversed ? lenB - partner.atMm : partner.atMm;
          expect(Math.abs(Math.min(fromSharedEndA, lenB) - fromSharedEndB)).toBeLessThanOrEqual(0.01);
        },
      ),
    );
  });

  it("partnerAtMm flips and clamps", () => {
    expect(partnerAtMm(30, 100, false)).toBe(30);
    expect(partnerAtMm(30, 100, true)).toBe(70);
    expect(partnerAtMm(130, 100, false)).toBe(100);
    expect(partnerAtMm(130, 100, true)).toBe(0);
  });
});

describe("grain line", () => {
  it("is centred, vertical and 60 % of the height (at least 120 mm)", () => {
    const [a, b] = defaultGrainLine(polygonPiece("p", rectanglePoints(200, 500)).stitchPath);
    expect(a).toEqual({ x: 100, y: 100 });
    expect(b).toEqual({ x: 100, y: 400 });
    const [c, d] = defaultGrainLine(polygonPiece("p", rectanglePoints(50, 60)).stitchPath);
    expect(d.y - c.y).toBe(120);
  });

  it("can be horizontal", () => {
    const [a, b] = defaultGrainLine(polygonPiece("p", rectanglePoints(500, 200)).stitchPath, "horizontal");
    expect(a.y).toBe(b.y);
    expect(b.x - a.x).toBe(300);
  });

  it("refuses a degenerate grain line", () => {
    const p = {
      ...polygonPiece("p", rectanglePoints(200, 500)),
      grainLine: [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ] as never,
    };
    expect(() => grainStep(ctxWith([p]))).toThrow(
      expect.objectContaining({ code: "FINISHING_GRAIN_MISSING" }),
    );
    expect(() => grainStep(ctxWith([polygonPiece("p", rectanglePoints(200, 500))]))).not.toThrow();
  });
});

describe("darts", () => {
  const piece = polygonPiece("p", rectanglePoints(300, 400));

  /**
   * The piece with one dart.
   *
   * @param apex - Dart tip.
   * @param leg - First leg.
   * @returns The piece.
   */
  function withDart(apex: { x: number; y: number }, leg: { x: number; y: number }): PieceDraft {
    return { ...piece, darts: [{ id: "d", edgeId: "e0", apex, legs: [leg, { x: 80, y: 0 }] }] };
  }

  it("accepts legs on the edge and an apex inside", () => {
    expect(() => dartStep(ctxWith([withDart({ x: 60, y: 90 }, { x: 40, y: 0 })]))).not.toThrow();
  });

  it("refuses a leg off the edge, an apex outside, an unknown edge", () => {
    expect(() => dartStep(ctxWith([withDart({ x: 60, y: 90 }, { x: 40, y: 5 })]))).toThrow(
      expect.objectContaining({ code: "FINISHING_DART_LEG_OFF_EDGE" }),
    );
    expect(() => dartStep(ctxWith([withDart({ x: 60, y: -90 }, { x: 40, y: 0 })]))).toThrow(
      expect.objectContaining({ code: "FINISHING_DART_APEX_OUTSIDE" }),
    );
    const bad = { ...withDart({ x: 60, y: 90 }, { x: 40, y: 0 }), edges: [] };
    expect(() => dartStep(ctxWith([bad]))).toThrow(
      expect.objectContaining({ code: "FINISHING_DART_EDGE_MISSING" }),
    );
  });
});

describe("catalogue use", () => {
  it("keeps PIECE_NAMES ids lowercase kebab-case", () => {
    for (const id of Object.keys(PIECE_NAMES)) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});
