/**
 * Unit tests of the neckline module (issue #139): style curves square to the shoulder, depth override and clamping
 * boundaries, the shared width limit, facing pieces and pairs, and the head-opening check.
 */
import type { DesignSpec, ValidationCheck } from "@tafsila/schemas";
import {
  boatNeckBlouse,
  dartedBlouse,
  princessShoulderBlouse,
  sizeM,
  straightKneeSkirt,
  vNeckBlouse,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import {
  FACING_WIDTH_MM,
  FRONT_NECKLINE_SIZES,
  FRONT_NECK_DEPTH_MIN_MM,
  NECK_MIN_SHOULDER_LEFT_MM,
  SQUARE_MIN_DEPTH_MM,
  SWEETHEART_MIN_DEPTH_MM,
} from "../../constants/neckline";
import {
  distancePointToPolyline,
  dot,
  normalize,
  samplePath,
  segmentLength,
  sub,
  tangentOnSegment,
} from "../../geometry";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import { generatePattern } from "../../pipeline/generate-pattern";
import { shapedContext } from "../../test-utils/shaped-context";
import { NECK_HALVES } from "../../pieces/neck-seam";
import { draftNeck } from "./draft-neck";
import { FACING_OUTER_EDGE_ID, FACING_PIECE_IDS, INTERFACING_PIECE_IDS } from "./facing";
import { necklineModule } from "./module";
import { type NeckBlockSizes, type NecklineSpec, clampMm, frontMinDepthMm, resolveNeck } from "./resolve";
import { NECKLINE_RULES } from "./rules";

const FRONTS = Object.keys(FRONT_NECKLINE_SIZES) as NecklineSpec["front"][];

/** Block sizes for the resolution tests: a size-M-like block. */
const SIZES: NeckBlockSizes = {
  blockDepthMm: { front: 84, back: 20 },
  scyeDepthMm: { front: 232, back: 232 },
  bustDepthMm: 250,
  dropPerWidenMm: { front: 0.37, back: 0.34 },
  maxWidenMm: 50,
};

/** Tolerance on positions, in mm. */
const POSITION_MM = 0.01;
/** Digits for `toBeCloseTo` at ± 0.01. */
const DIGITS = 2;

/**
 * The seed blouse with a neckline.
 *
 * @param neckline - Front, back and optional depth.
 * @param base - Base design.
 * @returns The design.
 */
function withNeck(neckline: Omit<NecklineSpec, "collar">, base: DesignSpec = dartedBlouse): DesignSpec {
  return { ...base, neckline: { ...neckline, collar: "none" } };
}

/**
 * A piece of a context by id.
 *
 * @param ctx - Context.
 * @param id - Piece id.
 * @returns The piece.
 */
function piece(ctx: DraftContext, id: string): PieceDraft {
  return ctx.pieces.find((p) => p.id === id)!;
}

/**
 * Segments of one edge of a piece.
 *
 * @param p - Piece.
 * @param edgeId - Edge id.
 * @returns The segments.
 */
function edge(p: PieceDraft, edgeId: string): PieceDraft["stitchPath"] {
  const e = p.edges.find((x) => x.id === edgeId)!;
  return p.stitchPath.slice(e.fromSegment, e.toSegment + 1);
}

/**
 * Every check the neckline rules report.
 *
 * @param ctx - Drafted context.
 * @returns The checks.
 */
function neckChecks(ctx: DraftContext): ValidationCheck[] {
  return NECKLINE_RULES.filter((r) => r.appliesTo(ctx)).flatMap((r) =>
    r.runMany ? [...r.runMany(ctx)] : [r.run(ctx)],
  );
}

describe("necklineModule", () => {
  it("applies to dresses and blouses with a neckline, not to skirts", () => {
    expect(necklineModule.appliesTo(dartedBlouse)).toBe(true);
    expect(necklineModule.appliesTo(straightKneeSkirt)).toBe(false);
    expect(necklineModule.appliesTo({ ...dartedBlouse, neckline: undefined })).toBe(false);
  });

  it.each(FRONTS)(
    "draws a %s front from the centre line to the neck point, square to the shoulder",
    (front) => {
      const ctx = shapedContext(withNeck({ front, back: "round" }), sizeM);
      const d = draftNeck(shapedContext({ ...dartedBlouse, neckline: undefined }, sizeM), ctx.spec.neckline!);
      const neck = edge(piece(ctx, "bodice-front"), "neck");
      expect(neck[0]!.from.x).toBeCloseTo(0, DIGITS);
      expect(neck.at(-1)!.to).toEqual(d.halves.front.neck.neckPoint);
      const shoulder = edge(piece(ctx, "bodice-front"), "shoulder")[0]!;
      const shoulderDir = normalize(sub(shoulder.to, shoulder.from));
      expect(Math.abs(dot(tangentOnSegment(neck.at(-1)!, 1), shoulderDir))).toBeLessThan(POSITION_MM);
    },
  );

  it("moves the front and back neck points the same distance along their shoulders", () => {
    const ctx = shapedContext(boatNeckBlouse, sizeM);
    const front = edge(piece(ctx, "bodice-front"), "shoulder");
    const back = edge(piece(ctx, "bodice-back"), "shoulder");
    const block = shapedContext({ ...dartedBlouse, neckline: undefined }, sizeM);
    const shortened = (id: string, now: PieceDraft["stitchPath"]) =>
      segmentLength(edge(piece(block, id), "shoulder")[0]!) - segmentLength(now[0]!);
    expect(shortened("bodice-front", front)).toBeCloseTo(shortened("bodice-back", back), DIGITS);
    expect(shortened("bodice-front", front)).toBeCloseTo(FRONT_NECKLINE_SIZES.boat.widenMm, DIGITS);
  });

  it("drafts the depth override exactly below the neck point when it is inside the limits", () => {
    const ctx = shapedContext(withNeck({ front: "round", back: "round", depthFrontMm: 150 }), sizeM);
    const neck = edge(piece(ctx, "bodice-front"), "neck");
    expect(neck[0]!.from.y - neck.at(-1)!.to.y).toBeCloseTo(150, DIGITS);
    expect(neckChecks(ctx).map((c) => c.code)).toEqual(["NECK_DEPTH_OK", "NECK_WIDTH_OK"]);
  });

  it("clamps a too shallow override to the minimum with a bilingual warning", () => {
    const ctx = shapedContext(withNeck({ front: "v", back: "round", depthFrontMm: 10 }), sizeM);
    const warning = neckChecks(ctx).find((c) => c.code === "NECK_FRONT_DEPTH_CLAMPED")!;
    expect(warning).toMatchObject({ status: "warn", measuredMm: 10, expectedMm: FRONT_NECK_DEPTH_MIN_MM });
    expect(warning.message.ar).toMatch(/[؀-ۿ]/);
    const neck = edge(piece(ctx, "bodice-front"), "neck");
    expect(neck[0]!.from.y - neck.at(-1)!.to.y).toBeCloseTo(FRONT_NECK_DEPTH_MIN_MM, DIGITS);
  });

  it("clamps a too deep override to the armscye clearance with a warning", () => {
    const ctx = shapedContext(withNeck({ front: "v", back: "round", depthFrontMm: 400 }), sizeM);
    const warning = neckChecks(ctx).find((c) => c.code === "NECK_FRONT_DEPTH_CLAMPED")!;
    expect(warning.status).toBe("warn");
    expect(warning.expectedMm).toBeLessThan(400);
    expect(
      generatePattern(withNeck({ front: "v", back: "round", depthFrontMm: 400 }), sizeM).validation.status,
    ).toBe("warn");
  });

  it("reshapes the princess centre panel and pairs the facing with it", () => {
    const ctx = shapedContext(withNeck({ front: "v", back: "v" }, princessShoulderBlouse), sizeM);
    const facing = piece(ctx, FACING_PIECE_IDS.front);
    expect(facing.edges.find((e) => e.id === "neck")!.pairsWith).toEqual({
      pieceId: "bodice-front-centre",
      edgeId: "neck",
    });
  });
});

describe("resolveNeck", () => {
  it("keeps a value on a limit exactly and clamps just past it", () => {
    expect(clampMm(40, 40, 200)).toMatchObject({ valueMm: 40, clamped: false });
    expect(clampMm(39.9, 40, 200)).toMatchObject({ valueMm: 40, clamped: true });
    expect(clampMm(200.1, 40, 200)).toMatchObject({ valueMm: 200, clamped: true });
  });

  it("adds the style depth to the block and shares the larger widening between the halves", () => {
    const r = resolveNeck({ front: "square", back: "round", collar: "none" }, SIZES);
    expect(r.depth.front.valueMm).toBe(SIZES.blockDepthMm.front + FRONT_NECKLINE_SIZES.square.depthAddMm);
    expect(r.depth.back.valueMm).toBe(SIZES.blockDepthMm.back);
    expect(r.widen.valueMm).toBe(FRONT_NECKLINE_SIZES.square.widenMm);
  });

  it("holds the widening so each shoulder keeps its minimum", () => {
    const r = resolveNeck({ front: "boat", back: "round", collar: "none" }, { ...SIZES, maxWidenMm: 12 });
    expect(r.widen).toMatchObject({
      requestedMm: FRONT_NECKLINE_SIZES.boat.widenMm,
      valueMm: 12,
      clamped: true,
    });
  });

  it("gives the sweetheart and the square their own shallowest depth", () => {
    expect(frontMinDepthMm("sweetheart")).toBe(SWEETHEART_MIN_DEPTH_MM);
    expect(frontMinDepthMm("square")).toBe(SQUARE_MIN_DEPTH_MM);
    expect(frontMinDepthMm("round")).toBe(FRONT_NECK_DEPTH_MIN_MM);
  });

  it("warns when the widening is held on a short princess shoulder", () => {
    const ctx = shapedContext(withNeck({ front: "boat", back: "round" }, princessShoulderBlouse), {
      ...sizeM,
      shoulderWidth: 330,
    });
    const width = neckChecks(ctx).find((c) => c.code?.startsWith("NECK_WIDTH"))!;
    expect(width.code).toBe("NECK_WIDTH_CLAMPED");
    expect(segmentLength(edge(piece(ctx, "bodice-front-centre"), "shoulder")[0]!)).toBeCloseTo(
      NECK_MIN_SHOULDER_LEFT_MM,
      DIGITS,
    );
  });
});

describe("neck facings", () => {
  const ctx = shapedContext(vNeckBlouse, sizeM);

  it("adds a facing and an interfacing per half, each one on the fold", () => {
    for (const half of NECK_HALVES) {
      expect(piece(ctx, FACING_PIECE_IDS[half]).cut).toEqual({
        quantity: 1,
        onFold: true,
        mirror: false,
        fabric: "main",
      });
      expect(piece(ctx, INTERFACING_PIECE_IDS[half]).cut.fabric).toBe("interfacing");
      expect(piece(ctx, INTERFACING_PIECE_IDS[half]).stitchPath).toEqual(
        piece(ctx, FACING_PIECE_IDS[half]).stitchPath,
      );
      expect(piece(ctx, INTERFACING_PIECE_IDS[half]).edges.every((e) => e.pairsWith === undefined)).toBe(
        true,
      );
    }
  });

  it("traces the facing neck from the bodice neck and keeps its outer edge the facing width away", () => {
    for (const [half, bodiceId] of [
      ["front", "bodice-front"],
      ["back", "bodice-back"],
    ] as const) {
      const facing = piece(ctx, FACING_PIECE_IDS[half]);
      expect(edge(facing, "neck")).toEqual(edge(piece(ctx, bodiceId), "neck"));
      const neck = samplePath(edge(facing, "neck"));
      const outer = samplePath(edge(facing, FACING_OUTER_EDGE_ID).slice(0, -1));
      for (const p of outer.slice(1, -1)) {
        expect(distancePointToPolyline(p, neck)).toBeGreaterThan(FACING_WIDTH_MM - 1);
      }
      expect(segmentLength(edge(facing, "shoulder")[0]!)).toBeCloseTo(FACING_WIDTH_MM, 0);
    }
  });

  it("pairs the facing shoulders with each other", () => {
    expect(piece(ctx, FACING_PIECE_IDS.front).edges.find((e) => e.id === "shoulder")!.pairsWith).toEqual({
      pieceId: FACING_PIECE_IDS.back,
      edgeId: "shoulder",
    });
  });
});

describe("head-opening check", () => {
  it("does not run when a centre-back zip opens the neck", () => {
    const ctx = shapedContext(dartedBlouse, sizeM);
    expect(neckChecks(ctx).some((c) => c.code?.startsWith("NECK_HEAD_"))).toBe(false);
  });

  it("warns for a round neck with no closure: it cannot pass over the head", () => {
    const ctx = shapedContext({ ...dartedBlouse, closure: { type: "none", position: "center-back" } }, sizeM);
    const head = neckChecks(ctx).find((c) => c.code?.startsWith("NECK_HEAD_"))!;
    expect(head).toMatchObject({ code: "NECK_HEAD_OPENING_TIGHT", status: "warn" });
    expect(head.measuredMm!).toBeLessThan(head.expectedMm!);
  });

  it("passes a deep V front and V back with a side zip", () => {
    const spec = {
      ...withNeck({ front: "v", back: "v" }),
      closure: { type: "zip", position: "side" },
    } as const;
    const head = neckChecks(shapedContext(spec, sizeM)).find((c) => c.code?.startsWith("NECK_HEAD_"))!;
    expect(head).toMatchObject({ code: "NECK_HEAD_OPENING_OK", status: "pass" });
  });
});
