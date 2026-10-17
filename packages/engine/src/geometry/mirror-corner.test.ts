/** Tests for the mirrored hem corner (issue #130), through `offsetPath` with `cornerAt`. */
import { describe, expect, it } from "vitest";
import { expectNear } from "../test-utils/expect-near";
import { offsetPath } from "./offset";
import { pt } from "./point";
import { type Segment, cubicSeg, lineSeg } from "./segment";
import { mirrorAcross } from "./transform";

const HEM_MM = 30;
const SIDE_MM = 15;
/** Horizontal run of the A-line side over its 400 mm height (it flares 50 mm towards the hem). */
const FLARE_MM = 50;
const HEIGHT_MM = 400;
/** Where the side cut line crosses the hem stitch line y = 0: 300 + 15 / cos(side angle). */
const P_X = 300 + (SIDE_MM * Math.hypot(FLARE_MM, HEIGHT_MM)) / HEIGHT_MM;
/** The mirrored side cut line meets the hem cut line y = −30 here. */
const Q = pt(P_X - (HEM_MM * FLARE_MM) / HEIGHT_MM, -HEM_MM);

/** Anticlockwise A-line half skirt: hem, side, waist, centre front. */
const aLine: Segment[] = [
  lineSeg(pt(0, 0), pt(300, 0)),
  lineSeg(pt(300, 0), pt(250, HEIGHT_MM)),
  lineSeg(pt(250, HEIGHT_MM), pt(0, HEIGHT_MM)),
  lineSeg(pt(0, HEIGHT_MM), pt(0, 0)),
];

describe("mirrored hem corner", () => {
  it("puts the hem-to-side corner of an A-line at the hand-computed point", () => {
    const cut = offsetPath(aLine, [HEM_MM, SIDE_MM, SIDE_MM, 0], {
      cornerAt: (i) => (i === 0 ? "mirror-hem-before" : "mitre"),
    });
    expect(cut.some((s) => Math.abs(s.to.x - Q.x) < 0.05 && Math.abs(s.to.y - Q.y) < 0.05)).toBe(true);
  });

  it("folds the hem allowance up onto the side seam allowance line", () => {
    const folded = mirrorAcross(Q, pt(0, 0), pt(1, 0));
    const sideCutXAt = (y: number) => P_X - (y * FLARE_MM) / HEIGHT_MM;
    expect(folded.x).toBeCloseTo(sideCutXAt(folded.y), 2);
  });

  it("gives the same corner for a clockwise path with the hem after the side", () => {
    const clockwise: Segment[] = [
      lineSeg(pt(0, 0), pt(0, HEIGHT_MM)),
      lineSeg(pt(0, HEIGHT_MM), pt(250, HEIGHT_MM)),
      lineSeg(pt(250, HEIGHT_MM), pt(300, 0)),
      lineSeg(pt(300, 0), pt(0, 0)),
    ];
    const cut = offsetPath(clockwise, [0, -SIDE_MM, -SIDE_MM, -HEM_MM], {
      cornerAt: (i) => (i === 2 ? "mirror-hem-after" : "mitre"),
    });
    const corner = cut.find((s) => Math.abs(s.from.y + HEM_MM) < 0.05 && s.from.x > 300)!;
    expectNear(corner.from, Q);
  });

  it("equals the mitre on a square corner", () => {
    const square: Segment[] = [
      lineSeg(pt(0, 0), pt(200, 0)),
      lineSeg(pt(200, 0), pt(200, 300)),
      lineSeg(pt(200, 300), pt(0, 300)),
      lineSeg(pt(0, 300), pt(0, 0)),
    ];
    const cut = offsetPath(square, [HEM_MM, SIDE_MM, SIDE_MM, SIDE_MM], {
      cornerAt: (i) => (i === 0 ? "mirror-hem-before" : "mitre"),
    });
    expect(cut.some((s) => Math.abs(s.to.x - 215) < 0.01 && Math.abs(s.to.y + HEM_MM) < 0.01)).toBe(true);
  });

  it("continues a curved side with a short straight run to the same corner", () => {
    const curvedSide = cubicSeg(pt(300, 0), pt(287.5, 100), pt(262.5, 300), pt(250, HEIGHT_MM));
    const curved = [aLine[0]!, curvedSide, aLine[2]!, aLine[3]!];
    const cut = offsetPath(curved, [HEM_MM, SIDE_MM, SIDE_MM, 0], {
      cornerAt: (i) => (i === 0 ? "mirror-hem-before" : "mitre"),
    });
    expect(cut.some((s) => Math.abs(s.to.x - Q.x) < 0.05 && Math.abs(s.to.y - Q.y) < 0.05)).toBe(true);
  });

  it("falls back to the mitre when the hem and the seam are in line", () => {
    const straight = [lineSeg(pt(0, 0), pt(100, 0)), lineSeg(pt(100, 0), pt(200, 0))];
    const cut = offsetPath(straight, [SIDE_MM, HEM_MM], { cornerAt: () => "mirror-hem-after" });
    expect(cut.at(-1)!.to).toEqual(pt(200, -HEM_MM));
  });
});
