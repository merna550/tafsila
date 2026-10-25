import { describe, expect, it } from "vitest";
import type { ProjectorCalibration } from "../projector.schema";
import {
  clampLineWidth,
  DEFAULT_VIEW,
  mmToPx,
  panBy,
  patternTransform,
  pxToMm,
  screenDeltaToSceneMm,
  stepMm,
  verificationSquare,
} from "./projector-view";

const SCREEN = { widthPx: 1920, heightPx: 1080, devicePixelRatio: 1 };

/**
 * Makes a calibration with the given factors.
 *
 * @param pxPerMmX - Horizontal factor.
 * @param pxPerMmY - Vertical factor.
 * @returns The calibration.
 */
function cal(pxPerMmX: number, pxPerMmY: number): ProjectorCalibration {
  return { version: 1, pxPerMmX, pxPerMmY, screen: SCREEN, calibratedAt: "2026-10-25T10:00:00.000Z" };
}

const VIEWPORT = { widthPx: 1000, heightPx: 600 };
const BOX = { widthMm: 300, heightMm: 200 };

describe("mm to px", () => {
  it("maps 100 mm to 400 px at 4 px/mm and back", () => {
    expect(mmToPx(cal(4, 4), { x: 100, y: 100 })).toEqual({ x: 400, y: 400 });
    expect(pxToMm(cal(4, 4), { x: 400, y: 400 })).toEqual({ x: 100, y: 100 });
  });

  it("uses a separate factor for each axis", () => {
    expect(mmToPx(cal(4, 4.2), { x: 100, y: 100 })).toEqual({ x: 400, y: 420 });
  });
});

describe("patternTransform", () => {
  it("centres the sheet, then scales with the factors of each axis", () => {
    expect(patternTransform(cal(4, 4.2), DEFAULT_VIEW, VIEWPORT, BOX)).toBe(
      "translate(500 300) scale(4 4.2) translate(-150 -100)",
    );
  });

  it("adds the pan in px", () => {
    const view = panBy(DEFAULT_VIEW, { x: 10, y: -5 });
    expect(patternTransform(cal(4, 4), view, VIEWPORT, BOX)).toBe(
      "translate(540 280) scale(4 4) translate(-150 -100)",
    );
  });

  it("mirror negates only the x scale", () => {
    const view = { ...DEFAULT_VIEW, mirror: true };
    expect(patternTransform(cal(4, 4), view, VIEWPORT, BOX)).toBe(
      "translate(500 300) scale(-1 1) scale(4 4) translate(-150 -100)",
    );
  });
});

describe("verificationSquare", () => {
  it("is 100 mm by the factors, near the bottom start corner", () => {
    expect(verificationSquare(cal(4, 4.2), VIEWPORT)).toEqual({ x: 24, y: 156, widthPx: 400, heightPx: 420 });
  });

  it("is the same with mirror on or off", () => {
    // The square takes no view argument at all: pan and mirror cannot reach it.
    expect(verificationSquare).toHaveLength(2);
  });
});

describe("pan and steps", () => {
  it("pans by 1, 10 and 50 mm", () => {
    let view = panBy(DEFAULT_VIEW, { x: 1, y: 0 });
    view = panBy(view, { x: 10, y: 0 });
    view = panBy(view, { x: 50, y: 0 });
    expect(view.panMm).toEqual({ x: 61, y: 0 });
  });

  it("picks the step from the modifier keys, Alt over Shift", () => {
    expect(stepMm({ shiftKey: false, altKey: false })).toBe(1);
    expect(stepMm({ shiftKey: true, altKey: false })).toBe(10);
    expect(stepMm({ shiftKey: false, altKey: true })).toBe(50);
    expect(stepMm({ shiftKey: true, altKey: true })).toBe(50);
  });

  it("negates x of a screen move when mirrored", () => {
    expect(screenDeltaToSceneMm({ x: 1, y: 2 }, true)).toEqual({ x: -1, y: 2 });
    expect(screenDeltaToSceneMm({ x: 1, y: 2 }, false)).toEqual({ x: 1, y: 2 });
  });
});

describe("clampLineWidth", () => {
  it("keeps the width between 1 and 6", () => {
    expect(clampLineWidth(0)).toBe(1);
    expect(clampLineWidth(9)).toBe(6);
    expect(clampLineWidth(3)).toBe(3);
  });
});
