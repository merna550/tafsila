/**
 * Unit tests of the waistband module (issue #140): each finish's pieces, the closure underlap, the cut info of the
 * interfacings and facings, the elastic notion and casing width, the dart-closed trace and the fallbacks.
 */
import type { DesignSpec, PatternResult, Piece } from "@tafsila/schemas";
import {
  contourBandSkirt,
  elasticGatheredSkirt,
  elasticStraightSkirt,
  gatheredKneeSkirt,
  pleatedKneeSkirt,
  sizeM,
  straightBandSkirt,
  straightKneeSkirt,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import {
  CASING_EASE_MM,
  CLOSURE_OVERLAP_MM,
  CONTOUR_BAND_WIDTH_MM,
  ELASTIC_LENGTH_RATIO,
  ELASTIC_WIDTH_MM,
  STRAIGHT_BAND_WIDTH_MM,
  WAIST_FACING_DEPTH_MM,
} from "../../constants/waistband";
import { DraftingError } from "../../errors/drafting-error";
import { pathLength } from "../../geometry";
import { edgeLengthMm } from "../../pieces/measure";
import { closedWaistMm } from "../../pieces/waist-seam";
import { createContext } from "../../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { OVERLAP_EDGE_ID, STRIP_END_EDGE_ID, STRIP_START_EDGE_ID } from "./strip";
import { TRACED_CENTRE_EDGE_ID, TRACED_FREE_EDGE_ID, TRACED_SEAM_EDGE_ID, closedWaistTrace } from "./traced";
import { draftWaistband, waistbandModule } from "./module";

/**
 * Drafts a design for size M.
 *
 * @param spec - The design.
 * @returns The pattern.
 */
function draft(spec: DesignSpec): PatternResult {
  return generatePattern(spec, sizeM, DEFAULT_ENGINE_OPTIONS);
}

/**
 * One piece of a pattern.
 *
 * @param result - The pattern.
 * @param id - Piece id.
 * @returns The piece.
 */
function piece(result: PatternResult, id: string): Piece {
  const found = result.pieces.find((p) => p.id === id);
  if (!found) throw new Error(`no piece ${id}`);
  return found;
}

/**
 * The check with a code.
 *
 * @param result - The pattern.
 * @param code - Check code.
 * @returns The check, or undefined.
 */
function check(result: PatternResult, code: string) {
  return result.validation.checks.find((c) => c.code === code);
}

/**
 * Height of a strip: its stitch path's vertical extent.
 *
 * @param p - A strip piece.
 * @returns Height in mm.
 */
function heightOf(p: Piece): number {
  const ys = p.stitchPath.map((s) => s.from.y);
  return Math.max(...ys) - Math.min(...ys);
}

/**
 * Whole-garment sewn skirt waist.
 *
 * @param result - The pattern.
 * @param gathers - Gathers drawn up or let out.
 * @returns Length in mm.
 */
function skirtWaist(result: PatternResult, gathers: "sewn" | "relaxed" = "sewn"): number {
  return result.pieces
    .filter((p) => p.cut.fabric === "main" && p.edges.some((e) => e.id === "waist"))
    .reduce((sum, p) => sum + closedWaistMm(p, gathers) * (p.cut.onFold ? 2 : p.cut.quantity), 0);
}

describe("straight band", () => {
  const result = draft(straightBandSkirt);
  const band = piece(result, "waistband");

  it("is the sewn waist plus the declared closure underlap, cut twice the finished width", () => {
    const seamMm = band.edges
      .filter((e) => e.id.startsWith("seam-"))
      .reduce((sum, e) => sum + edgeLengthMm(band, e.id), 0);
    expect(seamMm).toBeCloseTo(skirtWaist(result), 6);
    expect(edgeLengthMm(band, OVERLAP_EDGE_ID)).toBeCloseTo(CLOSURE_OVERLAP_MM, 9);
    expect(heightOf(band)).toBeCloseTo(2 * STRAIGHT_BAND_WIDTH_MM, 9);
    expect(band.cut).toEqual({ quantity: 1, onFold: false, mirror: false, fabric: "main" });
  });

  it("starts and ends in the back for a centre-back zip, one run per cut copy", () => {
    const pairs = band.edges.filter((e) => e.id.startsWith("seam-")).map((e) => e.pairsWith?.pieceId);
    expect(pairs).toEqual(["skirt-back", "skirt-front", "skirt-front", "skirt-back"]);
    expect(band.edges.find((e) => e.id === STRIP_END_EDGE_ID)?.pairsWith).toBeUndefined();
  });

  it("has an unpaired interfacing for the outer half", () => {
    const interfacing = piece(result, "waistband-interfacing");
    expect(interfacing.cut.fabric).toBe("interfacing");
    expect(heightOf(interfacing)).toBeCloseTo(STRAIGHT_BAND_WIDTH_MM, 9);
    expect(interfacing.edges.every((e) => e.pairsWith === undefined)).toBe(true);
  });

  it("runs front then back for a side zip, and reports the band length with the overlap", () => {
    const side = draft({ ...straightBandSkirt, closure: { type: "zip", position: "side" } });
    const pairs = piece(side, "waistband")
      .edges.filter((e) => e.id.startsWith("seam-"))
      .map((e) => e.pairsWith?.pieceId);
    expect(pairs).toEqual(["skirt-front", "skirt-front", "skirt-back", "skirt-back"]);
    expect(check(side, "WAISTBAND_LENGTH_OK")?.message.en).toContain(`overlap ${CLOSURE_OVERLAP_MM} mm`);
  });

  it("is a loop with no underlap when nothing opens, and must then pass the hip", () => {
    const loop = draft({ ...straightBandSkirt, closure: { type: "none", position: "side" } });
    const loopBand = piece(loop, "waistband");
    expect(loopBand.edges.some((e) => e.id === OVERLAP_EDGE_ID)).toBe(false);
    expect(loopBand.edges.find((e) => e.id === STRIP_END_EDGE_ID)?.pairsWith?.edgeId).toBe(
      STRIP_START_EDGE_ID,
    );
    expect(check(loop, "WAIST_HIP_PASS_TIGHT")?.status).toBe("warn");
  });
});

describe("contour band", () => {
  const result = draft(contourBandSkirt);

  it("adds a band, a band facing and an interfacing per half, cut like the skirt half", () => {
    const ids = result.pieces.map((p) => p.id).filter((id) => id.startsWith("waistband"));
    expect(ids).toEqual([
      "waistband-front",
      "waistband-facing-front",
      "waistband-interfacing-front",
      "waistband-back",
      "waistband-facing-back",
      "waistband-interfacing-back",
    ]);
    expect(piece(result, "waistband-front").cut).toEqual({
      ...piece(result, "skirt-front").cut,
      fabric: "main",
    });
    expect(piece(result, "waistband-interfacing-back").cut.fabric).toBe("interfacing");
  });

  it("sews its traced edge to the skirt waist with darts closed, and its top to the band facing", () => {
    for (const half of ["front", "back"] as const) {
      const band = piece(result, `waistband-${half}`);
      const skirt = piece(result, `skirt-${half}`);
      expect(edgeLengthMm(band, TRACED_SEAM_EDGE_ID)).toBeCloseTo(
        edgeLengthMm(skirt, "waist", { closeDarts: true }),
        6,
      );
      expect(band.edges.find((e) => e.id === TRACED_FREE_EDGE_ID)?.pairsWith?.pieceId).toBe(
        `waistband-facing-${half}`,
      );
      expect(band.edges.find((e) => e.id === TRACED_CENTRE_EDGE_ID)?.kind).toBe("fold");
    }
    expect(check(result, "WAISTBAND_LENGTH_OK")?.status).toBe("pass");
  });

  it("rises above the waist seam by the band width at the centre", () => {
    const band = piece(result, "waistband-front");
    const centre = band.stitchPath.at(-1)!;
    expect(centre.from.y - centre.to.y).toBeCloseTo(-CONTOUR_BAND_WIDTH_MM, 2);
  });

  it("is drafted straight on a gathered skirt, with a warning", () => {
    const flat = draft({ ...gatheredKneeSkirt, waistband: "contour" });
    expect(flat.pieces.some((p) => p.id === "waistband")).toBe(true);
    expect(check(flat, "WAISTBAND_CONTOUR_FLAT")?.status).toBe("warn");
  });
});

describe("elastic casing", () => {
  it("is as long as the relaxed waist and wide enough for the elastic, with the elastic as a notion", () => {
    const result = draft(elasticGatheredSkirt);
    const casing = piece(result, "waistband-casing");
    expect(heightOf(casing)).toBeCloseTo(2 * (ELASTIC_WIDTH_MM + CASING_EASE_MM), 9);
    const seamMm = casing.edges
      .filter((e) => e.id.startsWith("seam-"))
      .reduce((sum, e) => sum + edgeLengthMm(casing, e.id), 0);
    expect(seamMm).toBeCloseTo(skirtWaist(result, "relaxed"), 6);
    expect(result.notions).toEqual([
      {
        id: "waist-elastic",
        kind: "elastic",
        name: { ar: "أستك الوسط", en: "Waist elastic" },
        lengthMm: sizeM.waist * ELASTIC_LENGTH_RATIO,
        widthMm: ELASTIC_WIDTH_MM,
        quantity: 1,
      },
    ]);
    expect(check(result, "WAIST_HIP_PASS_OK")?.status).toBe("pass");
  });

  it("warns when a straight skirt cannot pass over the hip", () => {
    const result = draft(elasticStraightSkirt);
    const hip = check(result, "WAIST_HIP_PASS_TIGHT");
    expect(hip?.status).toBe("warn");
    expect(hip?.measuredMm).toBeLessThan(hip!.expectedMm!);
  });
});

describe("no band: waist facing", () => {
  it("traces a facing below the waist of a shaped skirt, with its interfacing", () => {
    const result = draft(straightKneeSkirt);
    const facing = piece(result, "waist-facing-front");
    const centre = facing.stitchPath.at(-1)!;
    expect(centre.from.y - centre.to.y).toBeCloseTo(WAIST_FACING_DEPTH_MM, 2);
    expect(facing.edges.find((e) => e.id === TRACED_SEAM_EDGE_ID)?.pairsWith).toEqual({
      pieceId: "skirt-front",
      edgeId: "waist",
      intendedEaseMm: 0,
    });
    expect(piece(result, "waist-facing-interfacing-back").cut.fabric).toBe("interfacing");
    expect(result.notions).toBeUndefined();
  });

  it("uses a flat facing on a pleated skirt, sewn to the pleated waist with the intake declared", () => {
    const result = draft(pleatedKneeSkirt);
    const facing = piece(result, "waist-facing");
    expect(heightOf(facing)).toBeCloseTo(WAIST_FACING_DEPTH_MM, 9);
    const first = facing.edges.find((e) => e.id === "seam-1")!;
    expect(first.pairsWith?.intendedEaseMm).toBeLessThan(0);
    expect(check(result, "WAISTBAND_LENGTH_OK")?.status).toBe("pass");
  });
});

describe("dart-closed trace", () => {
  it("keeps the waist length with the dart mouths left out", () => {
    const skirt = draft(straightKneeSkirt).pieces.find((p) => p.id === "skirt-back")!;
    expect(skirt.darts.length).toBeGreaterThan(0);
    expect(pathLength(closedWaistTrace(skirt))).toBeCloseTo(
      edgeLengthMm(skirt, "waist", { closeDarts: true }),
      6,
    );
  });
});

describe("module", () => {
  it("leaves a dress to its waist seam", () => {
    expect(waistbandModule.appliesTo(vNeckHalfCircleDress)).toBe(false);
    expect(waistbandModule.appliesTo(straightKneeSkirt)).toBe(true);
  });

  it("needs a drafted skirt waist", () => {
    const ctx = createContext(straightKneeSkirt, sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(() => draftWaistband(ctx)).toThrow(DraftingError);
  });
});
