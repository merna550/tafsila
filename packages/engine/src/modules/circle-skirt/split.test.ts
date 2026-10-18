/** Layout choice of the circle skirt: fewest pieces that fit the fabric (issue #136, FR-VAL-08). */
import { DEFAULT_SEAM_ALLOWANCE_MM } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { withSeamAllowance } from "../../finishing/seam-allowance";
import { widthAcrossGrainMm } from "../../pieces/fabric-width";
import { draftCircleQuarter } from "./draft";
import { circlePiece } from "./module";
import { type CircleLayout, chooseLayout, fitsFabric } from "./split";

const seamAllowance = { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: {} };
const quarter = draftCircleQuarter({ type: "circle-full", finishedWaistMm: 760, skirtLengthMm: 600 });

/**
 * Front and back of the test quarter for a layout.
 *
 * @param layout - The layout.
 * @returns The two pieces.
 */
const piecesFor = (layout: CircleLayout) =>
  (["front", "back"] as const).map((half) => circlePiece(half, quarter, layout === "centre-seams"));

/** Cut width of the folded front: the threshold between the two layouts. */
const foldWidthMm = widthAcrossGrainMm(withSeamAllowance(piecesFor("fold")[0]!, seamAllowance));

describe("chooseLayout", () => {
  it("keeps front and back on the fold when they fit", () => {
    const chosen = chooseLayout(piecesFor, { fabricWidthMm: foldWidthMm, seamAllowance });
    expect(chosen).toMatchObject({ layout: "fold", fits: true });
    expect(chosen.pieces.map((p) => p.cut.onFold)).toEqual([true, true]);
  });

  it("splits into four pieces with centre seams one millimetre narrower", () => {
    const chosen = chooseLayout(piecesFor, { fabricWidthMm: foldWidthMm - 1, seamAllowance });
    expect(chosen).toMatchObject({ layout: "centre-seams", fits: true });
    expect(chosen.pieces.map((p) => p.cut.quantity)).toEqual([2, 2]);
  });

  it("keeps the most split layout and reports it does not fit on very narrow fabric", () => {
    const chosen = chooseLayout(piecesFor, { fabricWidthMm: 300, seamAllowance });
    expect(chosen).toMatchObject({ layout: "centre-seams", fits: false });
  });

  it("counts the seam allowance in the width", () => {
    const stitchOnly = widthAcrossGrainMm({ ...piecesFor("fold")[0]!, cutPath: quarter.stitchPath });
    expect(fitsFabric(piecesFor("fold")[0]!, { fabricWidthMm: stitchOnly, seamAllowance })).toBe(false);
  });
});
