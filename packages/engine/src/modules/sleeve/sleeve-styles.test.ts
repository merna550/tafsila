/**
 * Unit tests of the sleeve styles at size M (issue #142, decision 142, 2 and 3): the puff head, the cap sleeve and
 * the flutter, against the set-in block they start from.
 */
import { patternResultSchema, type PatternResult, type Piece } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { SLEEVE_EDGE } from "../../blocks/sleeve/ids";
import { SLEEVE_CAP_TARGET_EASE_MM } from "../../constants/sleeve-block";
import { FLUTTER_DEPTH_MM, PUFF_CAP_GATHER_RATIO } from "../../constants/sleeve-style";
import { pathLength, pointAtLength } from "../../geometry";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import { CAP_SLEEVE_PIECE_ID } from "./cap-sleeve";
import { FLUTTER_PIECE_ID } from "./flutter";
import { PARTIAL_ARMHOLE_EXCLUDED_MM } from "./partial";
import { draftSleeveDesign, pieceOf } from "./test-support";

/** The block cap is kept up to the upper back notch and from the front notch. */
const BACK_KEPT_MM = 96;
const FRONT_KEPT_MM = 75;

/**
 * The whole cap of a sleeve piece, back underarm (or back end) to front.
 *
 * @param piece - A sleeve piece.
 * @returns Its cap segments.
 */
function wholeCap(piece: Piece) {
  return [...edgeSegments(piece, SLEEVE_EDGE.capBack), ...edgeSegments(piece, SLEEVE_EDGE.capFront)];
}

/**
 * The FR-VAL rows of a pattern that name a piece.
 *
 * @param r - Pattern.
 * @param id - Rule id.
 * @param pieceId - Piece id the row names.
 * @returns Matching checks.
 */
function rows(r: PatternResult, id: string, pieceId: string) {
  return r.validation.checks.filter(
    (c) => c.id === id && (c.refs ?? []).some((ref) => ref.startsWith(pieceId)),
  );
}

describe("puff sleeve, short, no cuff", () => {
  const setIn = pieceOf(draftSleeveDesign("set-in", "short", "none"), "sleeve");
  const result = draftSleeveDesign("puff", "short", "none");
  const puff = pieceOf(result, "sleeve");
  const blockCap = wholeCap(setIn);
  const puffCap = wholeCap(puff);
  const blockMm = pathLength(blockCap);
  const puffMm = pathLength(puffCap);

  it("keeps the block cap below the notches, and the notch positions", () => {
    expect(patternResultSchema.safeParse(result).success).toBe(true);
    for (const atMm of [0, 45, BACK_KEPT_MM]) {
      const a = pointAtLength(blockCap, atMm);
      const b = pointAtLength(puffCap, atMm);
      expect(Math.hypot(a.x - b.x, a.y - b.y), `back ${atMm}`).toBeLessThan(0.01);
    }
    for (const fromEndMm of [0, 40, FRONT_KEPT_MM]) {
      const a = pointAtLength(blockCap, blockMm - fromEndMm);
      const b = pointAtLength(puffCap, puffMm - fromEndMm);
      expect(Math.hypot(a.x - b.x, a.y - b.y), `front ${fromEndMm}`).toBeLessThan(0.01);
    }
    const capFront = (p: Piece) => edgeLengthMm(p, SLEEVE_EDGE.capFront);
    const notch = (p: Piece, id: string) => p.notches.find((n) => n.id === id)!.atMm;
    expect(notch(puff, "armhole-back-1")).toBe(notch(setIn, "armhole-back-1"));
    expect(notch(puff, "armhole-back-2")).toBe(notch(setIn, "armhole-back-2"));
    expect(capFront(puff) - notch(puff, "armhole-front")).toBeCloseTo(FRONT_KEPT_MM, 6);
  });

  it("redraws the head at 1.5 times its block length and declares the growth as gathers", () => {
    const blockMiddleMm = blockMm - BACK_KEPT_MM - FRONT_KEPT_MM;
    expect(puffMm - BACK_KEPT_MM - FRONT_KEPT_MM).toBeCloseTo(blockMiddleMm * PUFF_CAP_GATHER_RATIO, 0);
    expect(puff.sleeveCap?.gatheredMm).toBeCloseTo(puffMm - blockMm, 2);
    expect(puff.marks?.filter((m) => m.kind === "gather").map((m) => m.edgeId)).toEqual([
      SLEEVE_EDGE.capBack,
      SLEEVE_EDGE.capFront,
    ]);
  });

  it("passes FR-VAL-02 with the net ease and FR-VAL-01 on both cap halves", () => {
    const cap = rows(result, "FR-VAL-02", "sleeve")[0]!;
    expect(cap.status).toBe("pass");
    expect(cap.measuredMm).toBeCloseTo(SLEEVE_CAP_TARGET_EASE_MM, 0);
    const seams = rows(result, "FR-VAL-01", "sleeve/cap");
    expect(seams).toHaveLength(2);
    for (const row of seams) expect(row.status, row.message.en).toBe("pass");
    expect(result.validation.status).not.toBe("fail");
  });
});

describe("cap sleeve", () => {
  const result = draftSleeveDesign("cap", "short", "none");
  const cap = pieceOf(result, CAP_SLEEVE_PIECE_ID);
  const block = pieceOf(draftSleeveDesign("set-in", "short", "none"), "sleeve");

  it("is the block cap between the balance notches, self-lined, with no underarm seam", () => {
    const capMm = edgeLengthMm(cap, SLEEVE_EDGE.capBack) + edgeLengthMm(cap, SLEEVE_EDGE.capFront);
    expect(capMm).toBeCloseTo(pathLength(wholeCap(block)) - PARTIAL_ARMHOLE_EXCLUDED_MM, 2);
    expect(cap.sleeveCap?.armholeExcludedMm).toBe(165);
    expect(cap.edges.map((e) => e.id)).toEqual([SLEEVE_EDGE.capBack, SLEEVE_EDGE.capFront, SLEEVE_EDGE.hem]);
    expect(cap.cut).toEqual({ quantity: 4, onFold: false, mirror: true, fabric: "main" });
  });

  it("passes FR-VAL-02 and FR-VAL-04 with sleeve-end marks on the bodice", () => {
    expect(rows(result, "FR-VAL-02", CAP_SLEEVE_PIECE_ID)[0]?.status).toBe("pass");
    const notches = result.validation.checks.filter((c) => c.id === "FR-VAL-04");
    expect(notches.length).toBeGreaterThan(0);
    for (const row of notches) expect(row.status, row.message.en).toBe("pass");
    expect(notches.some((c) => c.code === "NOTCH_BROKEN_REF")).toBe(false);
    const ends = ["bodice-back", "bodice-front"].flatMap((id) =>
      (pieceOf(result, id).marks ?? []).filter((m) => m.kind === "sleeve-end"),
    );
    expect(ends.map((m) => m.id)).toEqual(["sleeve-end-back", "sleeve-end-front"]);
  });
});

describe("flutter sleeve", () => {
  const result = draftSleeveDesign("flutter", "short", "none");
  const flutter = pieceOf(result, FLUTTER_PIECE_ID);
  const armhole = (id: string) => edgeLengthMm(pieceOf(result, id), "armhole");
  const spanBackMm = armhole("bodice-back") - 90;
  const spanMm = spanBackMm + armhole("bodice-front") - FRONT_KEPT_MM;

  it("is a half circle eased onto the armhole span, with the shoulder notch at the back share", () => {
    const backMm = edgeLengthMm(flutter, SLEEVE_EDGE.capBack);
    const innerMm = backMm + edgeLengthMm(flutter, SLEEVE_EDGE.capFront);
    expect(innerMm).toBeCloseTo(spanMm + SLEEVE_CAP_TARGET_EASE_MM, 0);
    expect(edgeLengthMm(flutter, "hem")).toBeCloseTo(innerMm + Math.PI * FLUTTER_DEPTH_MM.short, 0);
    expect(backMm / innerMm).toBeCloseTo(spanBackMm / spanMm, 4);
    expect(flutter.notches).toEqual([
      expect.objectContaining({ id: "shoulder", edgeId: "cap-front", atMm: 0 }),
    ]);
    expect(flutter.cut.quantity).toBe(2);
  });

  it("passes every check", () => {
    expect(result.validation.checks.filter((c) => c.status === "fail")).toEqual([]);
  });
});
