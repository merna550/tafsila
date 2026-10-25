import type { PatternScene } from "@tafsila/engine/viewer";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IDENTITY_PLACEMENT,
  centreOnPiece,
  movePiece,
  nextPieceId,
  placementTransform,
  pruneToScene,
  resetPlacements,
  rotate180,
  rotatePiece,
  visiblePieceIds,
  type PlacementState,
} from "./placement";
import { placementKey, readPlacement, writePlacement } from "./placement-store";

const piece = (id: string, x: number): unknown => ({
  id,
  cell: { x, y: 20 },
  bboxMm: { widthMm: 100, heightMm: 200 },
});
const SCENE = {
  widthMm: 500,
  heightMm: 300,
  pieces: [piece("a", 0), piece("b", 150), piece("c", 300)],
} as unknown as PatternScene;
const START = resetPlacements();

/**
 * Puts a map-backed `window.localStorage` in place.
 *
 * @returns The map behind it.
 */
function stubStorage(): Map<string, string> {
  const data = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    },
  });
  return data;
}

afterEach(() => vi.unstubAllGlobals());

describe("rotation", () => {
  it("returns to the start after two half turns", () => {
    expect(rotate180(rotate180(IDENTITY_PLACEMENT))).toEqual(IDENTITY_PLACEMENT);
  });

  it("only ever has 0 or 180 after any sequence of moves and turns", () => {
    let seed = 7;
    const rnd = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    let state: PlacementState = START;
    for (let i = 0; i < 200; i++) {
      state =
        rnd() < 0.5
          ? rotatePiece(state, "a")
          : movePiece(state, "a", { x: rnd() * 90, y: rnd() }, rnd() < 0.5);
      expect([0, 180]).toContain(state.placements.a?.rotationDeg);
    }
  });

  it("turns about the centre of the cut box and is empty for the identity", () => {
    const p = SCENE.pieces[1]!;
    expect(placementTransform(p, IDENTITY_PLACEMENT)).toBe("");
    expect(placementTransform(p, rotate180(IDENTITY_PLACEMENT))).toBe("rotate(180 200 120)");
  });
});

describe("movePiece", () => {
  it("changes only the offset, never the size of the piece", () => {
    const moved = movePiece(START, "b", { x: 10, y: -5 }, false);
    expect(moved.placements.b).toEqual({ offsetMm: { x: 10, y: -5 }, rotationDeg: 0 });
    expect(SCENE.pieces[1]!.bboxMm).toEqual({ widthMm: 100, heightMm: 200 });
    expect(placementTransform(SCENE.pieces[1]!, moved.placements.b!)).toBe("translate(10 -5)");
  });

  it("flips the x move when the pattern is mirrored", () => {
    expect(movePiece(START, "a", { x: 10, y: 0 }, true).placements.a?.offsetMm.x).toBe(-10);
  });

  it("adds up and reset restores the layout", () => {
    let s = movePiece(START, "a", { x: 1, y: 1 }, false);
    s = movePiece(s, "a", { x: 1, y: 1 }, false);
    expect(s.placements.a?.offsetMm).toEqual({ x: 2, y: 2 });
    expect(resetPlacements()).toEqual(START);
  });
});

describe("scene helpers", () => {
  it("lists all pieces or one", () => {
    expect(visiblePieceIds(SCENE, "all")).toBe("all");
    expect(visiblePieceIds(SCENE, "b")).toEqual(["b"]);
    expect(visiblePieceIds(SCENE, "gone")).toBe("all");
  });

  it("drops pieces the scene no longer has", () => {
    const state: PlacementState = {
      selection: "gone",
      activePieceId: "gone",
      placements: { gone: IDENTITY_PLACEMENT, a: IDENTITY_PLACEMENT },
    };
    expect(pruneToScene(state, SCENE)).toEqual({
      selection: "all",
      activePieceId: null,
      placements: { a: IDENTITY_PLACEMENT },
    });
  });

  it("wraps around in both directions", () => {
    expect(nextPieceId(SCENE, "c", 1)).toBe("a");
    expect(nextPieceId(SCENE, "a", -1)).toBe("c");
    expect(nextPieceId(SCENE, null, 1)).toBe("a");
    expect(nextPieceId(SCENE, null, -1)).toBe("c");
  });

  it("pans so the placed piece centre is the screen centre, also mirrored", () => {
    // Piece b centre x = 200, scene centre x = 250; y: 120 vs 150.
    expect(centreOnPiece(SCENE, {}, "b", false)).toEqual({ x: 50, y: 30 });
    expect(centreOnPiece(SCENE, {}, "b", true)).toEqual({ x: -50, y: 30 });
    const moved = movePiece(START, "b", { x: 10, y: 0 }, false).placements;
    expect(centreOnPiece(SCENE, moved, "b", false)).toEqual({ x: 40, y: 30 });
  });
});

describe("placement store", () => {
  it("keeps placements per version and prunes unknown pieces", () => {
    const data = stubStorage();
    const state = movePiece(rotatePiece(START, "b"), "zzz", { x: 5, y: 5 }, false);
    expect(writePlacement("v1", { ...state, selection: "b", activePieceId: "b" })).toBe(true);
    expect([...data.keys()]).toEqual([placementKey("v1")]);
    const back = readPlacement("v1", SCENE);
    expect(back?.selection).toBe("b");
    expect(back?.activePieceId).toBeNull();
    expect(Object.keys(back!.placements)).toEqual(["b"]);
    expect(readPlacement("v2", SCENE)).toBeNull();
  });

  it("reads nothing from bad data or blocked storage", () => {
    const data = stubStorage();
    data.set(
      placementKey("v1"),
      JSON.stringify({
        version: 1,
        selection: "a",
        placements: { a: { offsetMm: { x: 0, y: 0 }, rotationDeg: 90 } },
      }),
    );
    expect(readPlacement("v1", SCENE)).toBeNull();
    vi.stubGlobal("window", {});
    expect(readPlacement("v1", SCENE)).toBeNull();
    expect(writePlacement("v1", START)).toBe(false);
  });
});
