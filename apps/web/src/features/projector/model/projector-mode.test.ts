import { describe, expect, it, vi } from "vitest";
import type { MarkerScene } from "@/shared/fabric-nesting";
import type { PiecesController } from "./controllers";
import { clampPan, layoutPieces, markerToScene, parseLayoutKind, startPan } from "./projector-mode";

const MARKER: MarkerScene = {
  kind: "main",
  layout: "folded",
  widthMm: 3000,
  heightMm: 700,
  pieces: [
    {
      shapeId: "front#1",
      pieceId: "front",
      name: { ar: "الأمام", en: "Front" },
      placement: {
        shapeId: "front#1",
        pieceId: "front",
        copyIndex: 1,
        xMm: 0,
        yMm: 0,
        rotation: 0,
        mirrored: false,
      },
      cutD: "M0.00 0.00 L400.00 0.00 L400.00 600.00 Z",
      grainD: "M20.00 100.00 L300.00 100.00",
      labelAt: { x: 200, y: 300 },
    },
  ],
  lines: [
    { kind: "fold", d: "M0.00 0.00 L3000.00 0.00" },
    { kind: "selvedge", d: "M0.00 700.00 L3000.00 700.00" },
  ],
};
const VIEWPORT = { x: 480, y: 270 };

describe("parseLayoutKind", () => {
  it("accepts the three kinds and nothing else", () => {
    expect(parseLayoutKind("main")).toBe("main");
    expect(parseLayoutKind(["lining", "main"])).toBe("lining");
    expect(parseLayoutKind("interfacing")).toBe("interfacing");
    expect(parseLayoutKind("other")).toBeNull();
    expect(parseLayoutKind(undefined)).toBeNull();
  });
});

describe("markerToScene", () => {
  it("keeps the strip as the sheet, the shapes as pieces and the two lines", () => {
    const scene = markerToScene(MARKER);
    expect(scene.widthMm).toBe(3000);
    expect(scene.heightMm).toBe(700);
    expect(scene.pieces.map((p) => p.id)).toEqual(["front#1"]);
    expect(scene.pieces[0]?.cutD).toBe(MARKER.pieces[0]?.cutD);
    expect(scene.lines?.map((l) => l.kind)).toEqual(["fold", "selvedge"]);
  });
});

describe("pan limits of a 3000 mm strip", () => {
  const sheet = { widthMm: MARKER.widthMm, heightMm: MARKER.heightMm };
  it("starts at the beginning of the strip", () => {
    expect(startPan(sheet, VIEWPORT).x).toBeGreaterThan(0);
  });
  it("reaches the far end and no further", () => {
    const start = startPan(sheet, VIEWPORT);
    const far = clampPan({ x: -1e6, y: 0 }, sheet, VIEWPORT);
    expect(far.x).toBe(-start.x);
    expect(clampPan({ x: far.x + 5, y: 0 }, sheet, VIEWPORT).x).toBe(far.x + 5);
    expect(clampPan({ x: 1e6, y: 0 }, sheet, VIEWPORT).x).toBe(start.x);
  });
  it("only allows a small margin when the strip fits the screen", () => {
    expect(
      Math.abs(clampPan({ x: 1e6, y: 0 }, { widthMm: 100, heightMm: 100 }, VIEWPORT).x),
    ).toBeLessThanOrEqual(20);
  });
});

describe("layoutPieces", () => {
  it("cannot turn, select or move pieces, and resets to the start", () => {
    const rotate = vi.fn(() => true);
    const move = vi.fn();
    const reset = vi.fn();
    const base = {
      rotateActive: rotate,
      move,
      moveActive: () => true,
      visible: ["x"],
    } as unknown as PiecesController;
    const mode = layoutPieces(base, reset);
    expect(mode.rotateActive()).toBe(false);
    expect(mode.moveActive({ x: 1, y: 0 })).toBe(false);
    mode.move("a", { x: 1, y: 1 });
    expect(move).not.toHaveBeenCalled();
    expect(mode.visible).toBe("all");
    mode.reset();
    expect(reset).toHaveBeenCalledOnce();
  });
});
