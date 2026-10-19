/** Unit tests of the princess bodice modules and their parts (issue #138). */
import type { DesignSpec, Piece } from "@tafsila/schemas";
import {
  princessArmholeBlouse,
  princessShoulderBlouse,
  setInSleeveBlouse,
  sizeM,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { PRINCESS_ARMHOLE_MIN_LOWER_MM, PRINCESS_SHOULDER_SHARE } from "../../constants/bodice-shaping";
import { DraftingError } from "../../errors/drafting-error";
import { cubicLength, distance, pathLength, pt, segmentLength } from "../../geometry";
import { edgeLengthMm } from "../../pieces/measure";
import { createContext } from "../../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { deepFreeze } from "../../test-utils/deep-freeze";
import { blockContext, shapedContext } from "../../test-utils/shaped-context";
import { bustDartPivot } from "./dart-pivot";
import { armholeSplitMm } from "./panel-parts";
import { bodiceOf, princessArmholeModule, princessShoulderModule } from "./princess";
import { styleCurve, trueStyleCurve } from "./style-line";
import { withFacings } from "../../test-utils/piece-ids";

const PRINCESS_IDS = ["bodice-back-centre", "bodice-back-side", "bodice-front-centre", "bodice-front-side"];

/**
 * The drafted pieces of a design for size M, by id.
 *
 * @param spec - The design.
 * @returns Pieces by id.
 */
function piecesOf(spec: DesignSpec): Record<string, Piece> {
  const ctx = shapedContext(spec, sizeM);
  return Object.fromEntries(ctx.pieces.map((p) => [p.id, p as Piece]));
}

/**
 * Length of one edge of a piece.
 *
 * @param piece - The piece.
 * @param edgeId - Edge id.
 * @returns Length in mm.
 */
function len(piece: Piece | undefined, edgeId: string): number {
  return edgeLengthMm(piece!, edgeId);
}

describe("bustDartPivot", () => {
  const dart = { bustPoint: pt(90, 260), upper: pt(260, 250), lower: pt(260, 275) };

  it("sits on the bust point's vertical, level with the middle of the dart", () => {
    expect(bustDartPivot(dart).pivot).toEqual(pt(90, 262.5));
  });

  it("carries the upper leg exactly onto the lower one", () => {
    const turned = bustDartPivot(dart).turn(dart.upper);
    expect(distance(turned, dart.lower)).toBeLessThan(1e-9);
  });
});

describe("trueStyleCurve", () => {
  const ends = { from: pt(0, 0), to: pt(40, 200), startDir: pt(0.196, 0.981), endDir: pt(0, 1) };

  it("finds the handle that gives the target length", () => {
    const target = cubicLength(styleCurve(ends)) + 0.5;
    expect(cubicLength(trueStyleCurve(ends, target))).toBeCloseTo(target, 3);
  });

  it("keeps the straight chord when the target is shorter than the chord", () => {
    expect(cubicLength(trueStyleCurve(ends, 10))).toBeCloseTo(distance(ends.from, ends.to), 6);
  });
});

describe("armholeSplitMm", () => {
  it("leaves enough armhole below the line for the sleeve notches", () => {
    expect(armholeSplitMm(200)).toBeCloseTo(70, 6);
    expect(armholeSplitMm(150)).toBeCloseTo(150 - PRINCESS_ARMHOLE_MIN_LOWER_MM, 6);
  });
});

describe("princess modules", () => {
  it("apply only to their own shaping", () => {
    expect(princessShoulderModule.appliesTo(princessShoulderBlouse)).toBe(true);
    expect(princessShoulderModule.appliesTo(princessArmholeBlouse)).toBe(false);
    expect(princessArmholeModule.appliesTo(princessArmholeBlouse)).toBe(true);
  });

  it("replace the two block halves by four panels", () => {
    expect(Object.keys(piecesOf(princessShoulderBlouse)).sort((a, b) => a.localeCompare(b, "en"))).toEqual(
      withFacings(PRINCESS_IDS),
    );
  });

  it("cut the centre panels on the fold and the side panels as mirrored pairs", () => {
    const p = piecesOf(princessShoulderBlouse);
    expect(p["bodice-front-centre"]!.cut).toMatchObject({ quantity: 1, onFold: true });
    expect(p["bodice-front-side"]!.cut).toMatchObject({ quantity: 2, onFold: false, mirror: true });
  });

  it("refuse to run before the bodice block", () => {
    const ctx = createContext(princessShoulderBlouse, sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(() => bodiceOf(ctx)).toThrow(DraftingError);
  });

  it("are pure: the same frozen input gives the same panels", () => {
    const spec = deepFreeze({ ...princessArmholeBlouse });
    expect(generatePattern(spec, sizeM)).toEqual(generatePattern(spec, sizeM));
  });
});

describe("shoulder princess line", () => {
  const p = piecesOf(princessShoulderBlouse);
  const block = bodiceOf(blockContext(princessShoulderBlouse, sizeM));
  const frontShoulderMm = distance(
    block.keyPoints["bodice.front.neckPoint"],
    block.keyPoints["bodice.front.shoulderTip"],
  );

  it("leaves the shoulder at its middle on the centre front panel", () => {
    expect(len(p["bodice-front-centre"], "shoulder")).toBeCloseTo(
      frontShoulderMm * PRINCESS_SHOULDER_SHARE,
      6,
    );
  });

  it("splits the shoulder seam between the panels without losing length", () => {
    const front = len(p["bodice-front-centre"], "shoulder") + len(p["bodice-front-side"], "shoulder");
    expect(front).toBeCloseTo(frontShoulderMm, 6);
  });

  it("keeps the whole armhole on the side panels", () => {
    expect(p["bodice-front-centre"]!.edges.some((e) => e.id === "armhole")).toBe(false);
    expect(len(p["bodice-front-side"], "armhole")).toBeCloseTo(block.armhole.frontLengthMm, 6);
  });

  it("puts the bust notch at the end of the upper stretch on both front panels", () => {
    const centre = p["bodice-front-centre"]!;
    const notch = centre.notches.find((n) => n.id === "princess-bust")!;
    const style = centre.edges.find((e) => e.id === "style")!;
    expect(notch.atMm).toBeCloseTo(segmentLength(centre.stitchPath[style.fromSegment]!), 9);
    expect(notch.pairsWith).toEqual({ pieceId: "bodice-front-side", edgeId: "style", reversed: true });
  });
});

describe("armhole princess line", () => {
  const p = piecesOf(princessArmholeBlouse);

  it("keeps the whole shoulder on the centre panels", () => {
    expect(p["bodice-front-side"]!.edges.some((e) => e.id === "shoulder")).toBe(false);
    expect(len(p["bodice-front-centre"], "shoulder")).toBeCloseTo(
      len(p["bodice-back-centre"], "shoulder"),
      6,
    );
  });

  it("splits each armhole between the panels without losing length", () => {
    const block = bodiceOf(blockContext(princessArmholeBlouse, sizeM));
    const front = len(p["bodice-front-centre"], "armhole") + len(p["bodice-front-side"], "armhole");
    const back = len(p["bodice-back-centre"], "armhole") + len(p["bodice-back-side"], "armhole");
    expect(front).toBeCloseTo(block.armhole.frontLengthMm, 3);
    expect(back).toBeCloseTo(block.armhole.backLengthMm, 3);
  });

  it("sews the sleeve to all four armhole parts", () => {
    const sleeve = p.sleeve!;
    expect(sleeve.sleeveCap!.armholeRefs.map((r) => r.pieceId)).toEqual([
      "bodice-back-centre",
      "bodice-back-side",
      "bodice-front-centre",
      "bodice-front-side",
    ]);
    expect(sleeve.edges.filter((e) => e.kind === "armhole").every((e) => e.pairsWith === undefined)).toBe(
      true,
    );
  });

  it("puts the sleeve balance notches on the side panels and the shoulder notch on the centre front", () => {
    const at = (id: string) =>
      Object.values(p).find((x) => x.id !== "sleeve" && x.notches.some((n) => n.id === id))?.id;
    expect(at("armhole-front")).toBe("bodice-front-side");
    expect(at("armhole-back-1")).toBe("bodice-back-side");
    expect(at("shoulder")).toBe("bodice-front-centre");
  });
});

describe("shoulder princess with a set-in sleeve", () => {
  it("pairs each cap half with the side panel armhole", () => {
    const p = piecesOf({ ...setInSleeveBlouse, bodice: princessShoulderBlouse.bodice! });
    const caps = p.sleeve!.edges.filter((e) => e.kind === "armhole").map((e) => e.pairsWith?.pieceId);
    expect(caps).toEqual(["bodice-back-side", "bodice-front-side"]);
    expect(pathLength(p.sleeve!.stitchPath)).toBeGreaterThan(0);
  });
});
