/** Unit tests of the closure module (issue #143): fold and seam per position, zip stop, buttons, none, refusals. */
import type { DesignSpec, Piece, PatternResult } from "@tafsila/schemas";
import {
  bishopSleeveBlouse,
  buttonFrontBlouse,
  buttonFrontDress,
  centreBackZipDress,
  centreFrontZipDress,
  dartedBlouse,
  noClosureDress,
  sideZipDress,
  sizeM,
  straightKneeSkirt,
  straightMidiBackSlitSkirt,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import {
  BUTTON_EXTENSION_MM,
  CUFF_BUTTON_DIAMETER_MM,
  ZIP_END_CLEARANCE_MM,
  ZIP_SEAM_ALLOWANCE_MM,
} from "../../constants/closure";
import { CUFF_OVERLAP_MM } from "../../constants/cuff";
import { pathLength } from "../../geometry";
import { buttonholeLengthMm, evenButtonStopsMm } from "../../pieces/button-marks";
import { closureOpensAt } from "../../pieces/closure-opening";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { INPUT_ERROR_MESSAGES } from "../../pipeline/input-errors";
import { VALIDATION_MESSAGES } from "../../validation/messages";
import { closureIssue } from "./compatibility";
import { zipLengthFor } from "./zip";

/** Wall-clock allowance for a few full pipeline runs on a busy CI runner with coverage. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/** SRS notch tolerance (FR-VAL-04). */
const NOTCH_TOLERANCE_MM = 2;

/** Decimal places compared for lengths. */
const DIGITS = 6;

/**
 * Drafts a design at size M.
 *
 * @param spec - The design.
 * @returns The pattern.
 */
function draft(spec: DesignSpec): PatternResult {
  return generatePattern(spec, sizeM, DEFAULT_ENGINE_OPTIONS);
}

/**
 * A piece of a result by id.
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
 * An edge of a piece by id.
 *
 * @param p - The piece.
 * @param id - Edge id.
 * @returns The edge.
 */
function edge(p: Piece, id: string): Piece["edges"][number] {
  return p.edges.find((e) => e.id === id)!;
}

/**
 * Length of an edge along the stitch line.
 *
 * @param p - The piece.
 * @param id - Edge id.
 * @returns Length in mm.
 */
function edgeMm(p: Piece, id: string): number {
  const e = edge(p, id);
  return pathLength(p.stitchPath.slice(e.fromSegment, e.toSegment + 1));
}

/** Cut info of a mirrored pair. */
const PAIR = { quantity: 2, onFold: false, mirror: true, fabric: "main" };

/** Cut info of one piece on the fold. */
const ON_FOLD = { quantity: 1, onFold: true, mirror: false, fabric: "main" };

describe("closure fold and seam per position", () => {
  it(
    "centre-back zip: the backs and the back facing turn to seams at the zip allowance, the front stays on the fold",
    () => {
      const r = draft(centreBackZipDress);
      for (const id of ["bodice-back", "skirt-back"]) {
        expect(piece(r, id).cut).toEqual(PAIR);
        expect(edge(piece(r, id), "cb")).toMatchObject({
          kind: "other",
          seamAllowanceMm: ZIP_SEAM_ALLOWANCE_MM,
          pairsWith: { pieceId: id, edgeId: "cb" },
        });
      }
      expect(piece(r, "neck-facing-back").cut).toEqual(PAIR);
      expect(edge(piece(r, "neck-facing-back-interfacing"), "fold").pairsWith).toBeUndefined();
      for (const id of ["bodice-front", "skirt-front"]) expect(piece(r, id).cut).toEqual(ON_FOLD);
      expect(r.validation.status).toBe("pass");
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it("centre-front zip: the fronts turn to seams, the backs stay on the fold", () => {
    const r = draft(centreFrontZipDress);
    for (const id of ["bodice-front", "skirt-front", "neck-facing-front"])
      expect(piece(r, id).cut).toEqual(PAIR);
    expect(edge(piece(r, "bodice-front"), "cf").seamAllowanceMm).toBe(ZIP_SEAM_ALLOWANCE_MM);
    for (const id of ["bodice-back", "skirt-back"]) expect(piece(r, id).cut).toEqual(ON_FOLD);
  });

  it("side zip: every centre stays on the fold and both side seams get the zip allowance", () => {
    const r = draft(sideZipDress);
    for (const id of ["bodice-front", "bodice-back", "skirt-front", "skirt-back"]) {
      expect(piece(r, id).cut).toEqual(ON_FOLD);
      expect(edge(piece(r, id), "side").seamAllowanceMm).toBe(ZIP_SEAM_ALLOWANCE_MM);
    }
  });

  it("none: every centre stays on the fold, nothing is bought, and the waist warns at the hips", () => {
    const r = draft(noClosureDress);
    for (const id of ["bodice-front", "bodice-back", "skirt-front", "skirt-back"]) {
      expect(piece(r, id).cut).toEqual(ON_FOLD);
    }
    expect(r.notions ?? []).toEqual([]);
    const hip = r.validation.checks.find((c) => c.code?.startsWith("CLOSURE_HIP_OPENING"))!;
    expect(hip).toMatchObject({ id: "FR-VAL-08", code: "CLOSURE_HIP_OPENING_TIGHT", status: "warn" });
    expect(hip.measuredMm!).toBeLessThan(hip.expectedMm!);
  });

  it("keeps a seam allowance the user set on a zip seam", () => {
    const options = {
      ...DEFAULT_ENGINE_OPTIONS,
      seamAllowance: { ...DEFAULT_ENGINE_OPTIONS.seamAllowance, perEdgeMm: { "bodice-back/cb": 25 } },
    };
    const r = generatePattern(centreBackZipDress, sizeM, options);
    expect(edge(piece(r, "bodice-back"), "cb").seamAllowanceMm).toBe(25);
    expect(edge(piece(r, "skirt-back"), "cb").seamAllowanceMm).toBe(ZIP_SEAM_ALLOWANCE_MM);
  });

  it("opens nowhere for none, whatever its position", () => {
    expect(closureOpensAt({ type: "none", position: "center-back" }, "center-back")).toBe(false);
    expect(closureOpensAt({ type: "zip", position: "center-back" }, "center-back")).toBe(true);
    expect(closureOpensAt({ type: "zip", position: "side" }, "center-back")).toBe(false);
  });
});

describe("zip stop and notion", () => {
  it("puts the dress zip stop on the skirt back, 560 mm below the neck, paired with its mirror", () => {
    const r = draft(centreBackZipDress);
    const back = piece(r, "skirt-back");
    const stop = back.notches.find((n) => n.id === "zip-stop")!;
    const bodiceCbMm = edgeMm(piece(r, "bodice-back"), "cb");
    // The skirt cb runs hem to waist, so the stop's distance from the waist is the edge length less atMm.
    const fromNeckMm = bodiceCbMm + edgeMm(back, "cb") - stop.atMm;
    expect(Math.abs(fromNeckMm - 560)).toBeLessThanOrEqual(NOTCH_TOLERANCE_MM);
    expect(stop.pairsWith).toMatchObject({ pieceId: "skirt-back", edgeId: "cb" });
    expect(r.notions).toEqual([
      expect.objectContaining({ id: "zip", kind: "zip", lengthMm: 560, quantity: 1 }),
    ]);
  });

  it("puts the skirt side zip stop on both side seams at 180 mm", () => {
    const r = draft(straightKneeSkirt);
    for (const id of ["skirt-front", "skirt-back"]) {
      const stop = piece(r, id).notches.find((n) => n.id === "zip-stop")!;
      expect(stop.edgeId).toBe("side");
      expect(stop.atMm).toBeCloseTo(180, DIGITS);
    }
  });

  it("runs a blouse zip the whole opening, rounded down to whole centimetres, with no stop notch", () => {
    const r = draft(dartedBlouse);
    const zip = r.notions!.find((n) => n.kind === "zip")!;
    const cbMm = edgeMm(piece(r, "bodice-back"), "cb");
    expect(zip.lengthMm).toBe(Math.floor(cbMm / 10) * 10);
    expect(piece(r, "bodice-back").notches.some((n) => n.id === "zip-stop")).toBe(false);
  });

  it("refuses a zip that does not stop above the bottom of the opening", () => {
    expect(() => zipLengthFor(straightKneeSkirt, 180 + ZIP_END_CLEARANCE_MM - 1)).toThrow(
      expect.objectContaining({ code: "CLOSURE_ZIP_TOO_LONG" }),
    );
    expect(zipLengthFor(straightKneeSkirt, 400)).toEqual({ lengthMm: 180, full: false });
  });
});

describe("buttons", () => {
  it(
    "extends every front piece, adds the traced facing and marks the buttons on the centre front",
    () => {
      const r = draft(buttonFrontDress);
      for (const pieceId of ["bodice-front", "skirt-front", "neck-facing-front"]) {
        const p = piece(r, pieceId);
        expect(p.cut).toEqual(PAIR);
        const id = edge(p, "cf") ? "cf" : "fold";
        expect(edge(p, id).kind).toBe("other");
        const ends = [edge(p, `${id}-top`).fromSegment, edge(p, `${id}-bottom`).fromSegment].toSorted(
          (x, y) => x - y,
        );
        expect(ends).toEqual([edge(p, id).fromSegment - 1, edge(p, id).toSegment + 1]);
      }
      for (const id of ["bodice-front-facing", "skirt-front-facing"]) {
        expect(edge(piece(r, id), "cf").pairsWith).toEqual({
          pieceId: id.replace("-facing", ""),
          edgeId: "cf",
        });
        expect(edgeMm(piece(r, id), "cf")).toBeCloseTo(
          edgeMm(piece(r, id.replace("-facing", "")), "cf"),
          DIGITS,
        );
        expect(piece(r, `${id}-interfacing`).cut.fabric).toBe("interfacing");
      }
      // The extension's top runs on from the neck, at the neck's allowance.
      expect(edge(piece(r, "bodice-front"), "cf-top").kind).toBe("neckline");
      const marks = r.pieces.flatMap((p) => p.marks ?? []);
      const buttons = marks.filter((m) => m.kind === "button");
      expect(buttons).toHaveLength(marks.filter((m) => m.kind === "buttonhole").length);
      expect(r.notions).toEqual([expect.objectContaining({ kind: "button", quantity: buttons.length })]);
      expect(r.validation.status).toBe("pass");
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it("keeps the circumference: the extension is an overlap, left out of the body lines", () => {
    const r = draft(buttonFrontBlouse);
    const bust = r.validation.checks.find((c) =>
      c.refs?.some((ref) => ref.endsWith("body-line:bodice-bust")),
    )!;
    expect(bust.status).toBe("pass");
    const front = piece(r, "bodice-front");
    expect(front.bodyLines.find((l) => l.id === "bodice-bust")).toMatchObject({
      overlapMm: BUTTON_EXTENSION_MM,
    });
  });

  it("spaces buttons evenly within the largest gap", () => {
    expect(evenButtonStopsMm(20, 200)).toEqual([20, 110, 200]);
    expect(evenButtonStopsMm(20, 20)).toEqual([20, 20]);
    expect(buttonholeLengthMm(15)).toBe(18);
  });

  it("marks the open wrist cuff with a button under the overlap and a buttonhole in it (decision 142, 5)", () => {
    const r = draft(bishopSleeveBlouse);
    const cuff = piece(r, "cuff");
    const button = cuff.marks!.find((m) => m.kind === "button")!;
    const hole = cuff.marks!.find((m) => m.kind === "buttonhole")!;
    if (button.shape !== "point" || hole.shape !== "line") throw new Error("wrong mark shapes");
    const seamMm = edgeMm(cuff, "seam-1");
    // Lapped, the overlap end lies over the start: the hole's button centre maps onto the button.
    expect(hole.from.x - 3 - seamMm).toBeCloseTo(button.at.x, DIGITS);
    expect(hole.from.y).toBeCloseTo(button.at.y, DIGITS);
    expect(button.at.x).toBeCloseTo(CUFF_OVERLAP_MM / 2, DIGITS);
    expect(hole.lengthMm).toBe(buttonholeLengthMm(CUFF_BUTTON_DIAMETER_MM));
  });
});

describe("closure combinations", () => {
  it("refuses buttons at the side and down a slit, with a bilingual input error", () => {
    expect(closureIssue({ ...dartedBlouse, closure: { type: "buttons", position: "side" } })).toBe(
      "CLOSURE_UNSUPPORTED",
    );
    const slit = {
      ...straightMidiBackSlitSkirt,
      closure: { type: "buttons", position: "center-back" },
    } as const;
    expect(closureIssue(slit)).toBe("CLOSURE_UNSUPPORTED");
    expect(closureIssue({ ...straightMidiBackSlitSkirt })).toBeUndefined();
    const r = draft({ ...dartedBlouse, closure: { type: "buttons", position: "side" } });
    expect(r.validation.status).toBe("fail");
    expect(r.validation.checks[0]).toMatchObject({
      code: "CLOSURE_UNSUPPORTED",
      message: INPUT_ERROR_MESSAGES.CLOSURE_UNSUPPORTED,
    });
  });

  it("has Arabic and English for every closure code", () => {
    for (const code of ["CLOSURE_UNSUPPORTED", "CLOSURE_ZIP_TOO_LONG"] as const) {
      expect(INPUT_ERROR_MESSAGES[code].ar.length).toBeGreaterThan(0);
    }
    for (const code of ["CLOSURE_HIP_OPENING_OK", "CLOSURE_HIP_OPENING_TIGHT"] as const) {
      expect(VALIDATION_MESSAGES[code].en.length).toBeGreaterThan(0);
    }
  });
});
