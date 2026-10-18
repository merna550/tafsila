/** Tests for the core structural validation rules (FR-VAL-05). */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { lineSeg } from "../../geometry";
import { rectanglePath, validationContext, validationPiece } from "../test-support";
import { closedOutlineRule, seamAllowancePresentRule, selfIntersectionRule } from "./structural";

describe("structural validation", () => {
  it("fails an open outline and points to its piece", () => {
    const path = rectanglePath(100, 200);
    const openPath = [...path.slice(0, -1), lineSeg({ x: 0, y: 200 }, { x: 0, y: 1 })];
    const check = closedOutlineRule.run(validationContext([validationPiece({ stitchPath: openPath })]));
    expect(check).toMatchObject({ code: "STRUCT_OPEN_PATH", status: "fail", refs: ["front"] });
  });

  it("fails a bow-tie outline and points to its piece", () => {
    const bowTie = [
      lineSeg({ x: 0, y: 0 }, { x: 100, y: 100 }),
      lineSeg({ x: 100, y: 100 }, { x: 0, y: 100 }),
      lineSeg({ x: 0, y: 100 }, { x: 100, y: 0 }),
      lineSeg({ x: 100, y: 0 }, { x: 0, y: 0 }),
    ];
    const check = selfIntersectionRule.run(validationContext([validationPiece({ stitchPath: bowTie })]));
    expect(check).toMatchObject({ code: "STRUCT_SELF_INTERSECTION", status: "fail", refs: ["front"] });
  });

  it("fails a non-fold edge with no seam allowance and returns its edge ref", () => {
    const piece = validationPiece();
    const edges = piece.edges.map((edge) => (edge.id === "side" ? { ...edge, seamAllowanceMm: 0 } : edge));
    const check = seamAllowancePresentRule.run(validationContext([{ ...piece, edges }]));
    expect(check).toMatchObject({ code: "STRUCT_MISSING_SA", status: "fail" });
    expect(check.refs).toContain("front/side");
  });

  it("passes closed offset rectangles across many dimensions", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 1000 }),
        fc.integer({ min: 20, max: 1000 }),
        (widthMm, heightMm) => {
          const piece = validationPiece({
            stitchPath: rectanglePath(widthMm, heightMm),
            cutPath: rectanglePath(widthMm + 20, heightMm + 20, -10, -10),
          });
          const context = validationContext([piece]);
          expect(closedOutlineRule.run(context).status).toBe("pass");
          expect(selfIntersectionRule.run(context).status).toBe("pass");
          expect(seamAllowancePresentRule.run(context).status).toBe("pass");
        },
      ),
    );
  });
});
