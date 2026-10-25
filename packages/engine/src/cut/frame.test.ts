import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { lineSeg, pt, samplePath } from "../geometry";
import { rectanglePiece } from "../test-utils/cut-piece";
import { expectNear } from "../test-utils/expect-near";
import { cutFrame, fromFrame, toFrame } from "./frame";

describe("cutFrame (issue #284, ADR-281 item 5)", () => {
  it("uses the fold as reference, with the origin at the top of the fold", () => {
    const piece = rectanglePiece({ fold: true, at: pt(50, 40) });
    const frame = cutFrame(piece);
    expect(frame.kind).toBe("fold");
    expectNear(frame.origin, pt(50, 40));
    expectNear(frame.along, pt(0, 1));
    const corner = toFrame(frame, pt(250, 340));
    expect(corner.along).toBeCloseTo(300, 6);
    expect(corner.across).toBeCloseTo(200, 6);
  });

  it("measures into the piece when the fold is on the right", () => {
    const piece = rectanglePiece();
    const frame = cutFrame({
      ...piece,
      edges: piece.edges.map((e) => (e.id === "right" ? { ...e, kind: "fold" } : e)),
    });
    expectNear(frame.origin, pt(200, 0));
    expect(toFrame(frame, pt(0, 300)).across).toBeCloseTo(200, 6);
  });

  it("uses a grain-parallel line through the leftmost cut point when there is no fold", () => {
    const piece = rectanglePiece({ at: pt(10, 20), grainLine: [pt(110, 300), pt(110, 100)] });
    const frame = cutFrame(piece);
    expect(frame.kind).toBe("grain");
    expectNear(frame.origin, pt(10, 20));
    expectNear(frame.along, pt(0, 1));
    expectNear(frame.across, pt(1, 0));
  });

  it("keeps every cut point at along and across ≥ 0 for a 45° grain", () => {
    const piece = rectanglePiece({ grainLine: [pt(50, 50), pt(150, 150)] });
    const frame = cutFrame(piece);
    for (const p of samplePath(piece.cutPath)) {
      const position = toFrame(frame, p);
      expect(position.along).toBeGreaterThanOrEqual(-1e-9);
      expect(position.across).toBeGreaterThanOrEqual(-1e-9);
    }
    expect(Math.abs(frame.along.x)).toBeCloseTo(Math.SQRT1_2, 6);
  });

  it("points a horizontal reference to the right", () => {
    const frame = cutFrame(rectanglePiece({ grainLine: [pt(150, 100), pt(50, 100)] }));
    expectNear(frame.along, pt(1, 0));
  });

  it("throws CUT_FOLD_NOT_STRAIGHT for a bent fold edge", () => {
    const piece = rectanglePiece({ fold: true });
    const bent = [
      ...piece.stitchPath.slice(0, 3),
      lineSeg(pt(0, 300), pt(5, 150)),
      lineSeg(pt(5, 150), pt(0, 0)),
    ];
    const edges = piece.edges.map((e) => (e.id === "left" ? { ...e, toSegment: 4 } : e));
    const error = (() => {
      try {
        cutFrame({ ...piece, stitchPath: bent, cutPath: bent, edges });
      } catch (e) {
        return e;
      }
    })();
    expect(error).toBeInstanceOf(DraftingError);
    expect((error as DraftingError).code).toBe("CUT_FOLD_NOT_STRAIGHT");
  });

  it("fromFrame undoes toFrame", () => {
    const frame = cutFrame(rectanglePiece({ grainLine: [pt(20, 10), pt(80, 200)] }));
    const p = pt(123.4, 56.7);
    const { along, across } = toFrame(frame, p);
    expectNear(fromFrame(frame, along, across), p);
  });
});
