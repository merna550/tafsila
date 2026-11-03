import { defaultSpec } from "@tafsila/engine/spec-rules";
import type { DesignAnalysisResult } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import {
  canContinue,
  changeFeature,
  confirmFeature,
  dismissReset,
  initConfirmState,
  remainingPaths,
  undoChange,
} from "./confirm-state";

const skirt = { ...defaultSpec("skirt"), skirt: { type: "circle-half" as const, length: "midi" as const } };

/** An analysis with two low features, one medium and one without a value. */
const result: DesignAnalysisResult = {
  spec: skirt,
  category: { value: "skirt", confidence: 0.9 },
  confidence: { "skirt.type": 0.48, "skirt.length": 0.74, waistband: 0.5 },
  notes: [],
  unsupported: [],
};

describe("confirm state", () => {
  it("waits only for features below 0.6; the rest and those without a value count as confirmed", () => {
    const state = initConfirmState(result);
    expect([...state.unconfirmed].sort((a, b) => a.localeCompare(b))).toEqual(["skirt.type", "waistband"]);
    expect(canContinue(state)).toBe(false);
  });

  it("looks right confirms one feature", () => {
    const state = confirmFeature(initConfirmState(result), "skirt.type");
    expect(remainingPaths(state)).toEqual(["waistband"]);
  });

  it("changing a value confirms it and runs the rules", () => {
    const state = changeFeature(initConfirmState(result), "skirt.type", "straight");
    expect(state.spec.skirt?.type).toBe("straight");
    expect(state.unconfirmed.has("skirt.type")).toBe(false);
    expect(state.touched).toBe(true);
  });

  it("lists the features the rules corrected and can undo", () => {
    const gathered = { ...skirt, skirt: { type: "gathered" as const, length: "knee" as const } };
    const start = initConfirmState({ ...result, spec: gathered });
    const next = changeFeature(start, "bodice.waistSeam", false);
    expect(next.resetPaths.length).toBeGreaterThan(0);
    expect(dismissReset(next).resetPaths).toEqual([]);
    expect(undoChange(next).spec).toEqual(gathered);
  });

  it("can continue once every low feature is confirmed", () => {
    let state = initConfirmState(result);
    state = confirmFeature(confirmFeature(state, "skirt.type"), "waistband");
    expect(canContinue(state)).toBe(true);
  });

  it("ignores a waiting feature that no longer applies to the design", () => {
    const state = changeFeature(
      initConfirmState({ ...result, confidence: { "skirt.slit": 0.3 } }),
      "skirt.type",
      "circle-full",
    );
    expect(remainingPaths(state).every((p) => p !== "category")).toBe(true);
  });
});
