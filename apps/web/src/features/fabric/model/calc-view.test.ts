import type { FabricCalc } from "@tafsila/schemas";
import { DEFAULT_FABRIC_OPTIONS } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import type { FabricAnswer, FabricKindView, MarkerScene } from "@/shared/fabric-nesting";
import { isSavable, saveBodyOf, viewOfAnswer, viewOfSaved } from "./calc-view";

const SCENE: MarkerScene = {
  kind: "main",
  layout: "folded",
  widthMm: 1800,
  heightMm: 700,
  pieces: [],
  lines: [],
};
const kind = (k: FabricKindView["kind"], lengthM: number): FabricKindView => ({
  kind: k,
  lengthM,
  placements: [{ shapeId: "front#1", xMm: 0, yMm: 0, turn: 0 }],
  scene: { ...SCENE, kind: k },
});
const ANSWER: FabricAnswer = {
  kinds: [kind("main", 1.8), kind("interfacing", 0.6)],
  doesNotFit: [],
  suggestOpen: false,
  nestingVersion: "1.0.0",
};

describe("calc view", () => {
  it("builds the view of a fresh answer with its scenes", () => {
    const view = viewOfAnswer(ANSWER, DEFAULT_FABRIC_OPTIONS);
    expect(view.kinds.map((k) => [k.kind, k.lengthM, k.scene !== null])).toEqual([
      ["main", 1.8, true],
      ["interfacing", 0.6, true],
    ]);
  });

  it("builds the view of a saved result without scenes", () => {
    const saved: FabricCalc = {
      versionId: "00000000-0000-4000-8000-000000000001",
      options: DEFAULT_FABRIC_OPTIONS,
      result: { kinds: [{ kind: "main", lengthM: 2.1, placements: [] }] },
      nestingVersion: "0.9.0",
      updatedAt: "2026-10-28T10:00:00.000Z",
    };
    expect(viewOfSaved(saved)).toMatchObject({
      kinds: [{ kind: "main", lengthM: 2.1, scene: null }],
      nestingVersion: "0.9.0",
    });
  });

  it("makes a save body from a complete answer", () => {
    const body = saveBodyOf(ANSWER, DEFAULT_FABRIC_OPTIONS);
    expect(body?.nestingVersion).toBe("1.0.0");
    expect(body?.result).toEqual({
      kinds: [
        { kind: "main", lengthM: 1.8, placements: [{ shapeId: "front#1", xMm: 0, yMm: 0, turn: 0 }] },
        { kind: "interfacing", lengthM: 0.6, placements: [{ shapeId: "front#1", xMm: 0, yMm: 0, turn: 0 }] },
      ],
    });
  });

  it("does not save when a piece does not fit, a length is zero or nothing was placed", () => {
    const notFit = {
      pieceId: "sleeve",
      fabric: "main",
      widthMm: 740,
      usableWidthMm: 700,
      fitsOpen: true,
      name: { ar: "كم", en: "Sleeve" },
    } as const;
    expect(isSavable({ ...ANSWER, doesNotFit: [notFit] })).toBe(false);
    expect(isSavable({ ...ANSWER, kinds: [kind("main", 0)] })).toBe(false);
    expect(isSavable({ ...ANSWER, kinds: [] })).toBe(false);
    expect(saveBodyOf({ ...ANSWER, doesNotFit: [notFit] }, DEFAULT_FABRIC_OPTIONS)).toBeNull();
  });
});
