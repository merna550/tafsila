/**
 * Unit tests of the collar module (issue #141): the opening and cut of each collar, the peter pan width, shoulder
 * overlap and turn of cloth, the shirt fall against its stand, the stand rises and extension, the notches on the collar
 * and the bodice, and the neck facings that stand collars replace.
 */
import type { DesignSpec, PatternResult, Piece } from "@tafsila/schemas";
import { mandarinBlouse, peterPanBlouse, shirtCollarBlouse, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { BUTTON_EXTENSION_MM } from "../../constants/closure";
import {
  COLLAR_TURN_OF_CLOTH_MM,
  MANDARIN_CF_RISE_MM,
  PETER_PAN_SHOULDER_OVERLAP_MM,
  PETER_PAN_WIDTH_MM,
  SHIRT_STAND_CF_RISE_MM,
} from "../../constants/collar";
import { DraftingError } from "../../errors/drafting-error";
import { add, distance, scale } from "../../geometry";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import { neckHolders } from "../../pieces/neck-seam";
import { createContext } from "../../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { collarModule, draftCollar } from "./module";
import { peterPanNeck } from "./peter-pan";

/** Width and overlap tolerance. */
const SHAPE_MM = 0.5;
/** Construction tolerance (equal by construction). */
const EXACT_MM = 0.1;

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
 * Ids of a pattern's pieces.
 *
 * @param result - The pattern.
 * @returns The ids.
 */
function ids(result: PatternResult): string[] {
  return result.pieces.map((p) => p.id);
}

const CF_ZIP = { type: "zip", position: "center-front" } as const;

describe("peter pan collar", () => {
  it("is a mirrored pair when the closure opens at CB", () => {
    const upper = piece(draft(peterPanBlouse), "collar-upper");
    expect(upper.cut).toMatchObject({ quantity: 2, onFold: false, mirror: true });
    expect(upper.edges.map((e) => e.id)).toEqual(["neck-back", "neck-front", "outer"]);
  });

  it("is cut on the CB fold otherwise, 70 mm wide at CB, the under collar 3 mm less", () => {
    const result = draft({ ...peterPanBlouse, closure: CF_ZIP });
    const upper = piece(result, "collar-upper");
    expect(upper.cut).toMatchObject({ quantity: 1, onFold: true });
    expect(upper.edges.at(-1)).toMatchObject({ id: "cb", kind: "fold" });
    expect(Math.abs(edgeLengthMm(upper, "cb") - PETER_PAN_WIDTH_MM)).toBeLessThanOrEqual(SHAPE_MM);
    const under = piece(result, "collar-under");
    const underWidth = PETER_PAN_WIDTH_MM - COLLAR_TURN_OF_CLOTH_MM;
    expect(Math.abs(edgeLengthMm(under, "cb") - underWidth)).toBeLessThanOrEqual(SHAPE_MM);
    expect(edgeLengthMm(under, "outer")).toBeLessThan(edgeLengthMm(upper, "outer"));
    expect(piece(result, "collar-interfacing").cut.fabric).toBe("interfacing");
  });

  it("overlaps the shoulders 13 mm at the shoulder tip, toward the front", () => {
    const pieces = draft(peterPanBlouse).pieces;
    const holders = neckHolders(pieces);
    const front = edgeSegments(holders.front.piece, "shoulder")[0]!;
    const shoulderMm = distance(front.from, front.to);
    const trace = peterPanNeck(pieces, holders);
    const backTip = add(front.from, scale(trace.backShoulderDir, shoulderMm));
    expect(Math.abs(distance(backTip, front.to) - PETER_PAN_SHOULDER_OVERLAP_MM)).toBeLessThanOrEqual(
      SHAPE_MM,
    );
    expect(trace.neck.front.at(-1)!.to).toEqual(holders.front.neck[0]!.from);
  });
});

describe("stand collars", () => {
  it("shirt: the fall's stand edge is the stand top, the stand rises 10 mm and runs on 15 mm for buttons", () => {
    const result = draft(shirtCollarBlouse);
    const stand = piece(result, "collar-stand");
    const fall = piece(result, "collar-upper");
    expect(Math.abs(edgeLengthMm(fall, "stand") - edgeLengthMm(stand, "top"))).toBeLessThanOrEqual(EXACT_MM);
    expect(edgeSegments(stand, "neck-front").at(-1)!.to.y).toBeCloseTo(-SHIRT_STAND_CF_RISE_MM, 6);
    const neckEnd = edgeSegments(stand, "neck-front").at(-1)!.to;
    const reach = Math.max(...edgeSegments(stand, "extension").map((s) => distance(neckEnd, s.to)));
    expect(reach).toBeGreaterThanOrEqual(BUTTON_EXTENSION_MM - EXACT_MM);
    expect(stand.cut).toMatchObject({ quantity: 2, onFold: true });
  });

  it("shirt with a CF zip has no extension", () => {
    const stand = piece(draft({ ...shirtCollarBlouse, closure: CF_ZIP }), "collar-stand");
    expect(stand.edges.map((e) => e.id)).not.toContain("extension");
  });

  it("mandarin: stand only, rising 15 mm at CF", () => {
    const result = draft(mandarinBlouse);
    expect(ids(result).filter((id) => id.startsWith("collar"))).toEqual([
      "collar-stand",
      "collar-stand-interfacing",
    ]);
    const stand = piece(result, "collar-stand");
    expect(edgeSegments(stand, "neck-front").at(-1)!.to.y).toBeCloseTo(-MANDARIN_CF_RISE_MM, 6);
  });
});

describe("neck seam", () => {
  it.each([
    ["peter pan", peterPanBlouse, "collar-upper"],
    ["shirt", shirtCollarBlouse, "collar-stand"],
    ["mandarin", mandarinBlouse, "collar-stand"],
  ] as const)("%s: notches at CB, shoulder and CF on the collar and the bodice", (_name, spec, collarId) => {
    const result = draft(spec);
    const collar = piece(result, collarId);
    expect(collar.notches.map((n) => n.id).filter((id) => id.startsWith("collar-"))).toEqual([
      "collar-cb",
      "collar-shoulder-back",
      "collar-shoulder-front",
      "collar-cf",
    ]);
    const front = piece(result, "bodice-front");
    const back = piece(result, "bodice-back");
    const cf = front.notches.find((n) => n.id === "collar-cf")!;
    expect(cf).toMatchObject({ edgeId: "neck", atMm: 0 });
    const shoulder = front.notches.find((n) => n.id === "collar-shoulder-front")!;
    expect(shoulder.atMm).toBeCloseTo(edgeLengthMm(front, "neck"), 6);
    expect(back.notches.find((n) => n.id === "collar-cb")).toMatchObject({ edgeId: "neck", atMm: 0 });
    const collarNotches = result.validation.checks.filter(
      (c) => c.id === "FR-VAL-04" && c.refs?.some((r) => r.startsWith("collar")),
    );
    expect(collarNotches.length).toBeGreaterThan(0);
    expect(collarNotches.every((c) => c.status === "pass")).toBe(true);
    const neck = result.validation.checks.find((c) => c.code === "COLLAR_NECK_LENGTH_OK");
    expect(neck?.status).toBe("pass");
  });

  it("keeps the neck facings under a peter pan and drops them under a stand", () => {
    expect(ids(draft(peterPanBlouse))).toContain("neck-facing-front");
    expect(ids(draft(shirtCollarBlouse))).not.toContain("neck-facing-front");
    expect(ids(draft(mandarinBlouse))).not.toContain("neck-facing-back");
  });
});

describe("collar module", () => {
  it("applies to a bodice with a collar only", () => {
    expect(collarModule.appliesTo(peterPanBlouse)).toBe(true);
    expect(
      collarModule.appliesTo({
        ...peterPanBlouse,
        neckline: { ...peterPanBlouse.neckline!, collar: "none" },
      }),
    ).toBe(false);
  });

  it("needs the bodice first", () => {
    const ctx = createContext(peterPanBlouse, sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(() => draftCollar(ctx)).toThrow(DraftingError);
  });
});
