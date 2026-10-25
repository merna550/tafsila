import { describe, expect, it } from "vitest";
import { calibrationFrom, nominalSquarePx, parseMeasuredMm } from "./calibration";
import type { ScreenInfo } from "../projector.schema";

const screen = (widthPx: number, heightPx: number): ScreenInfo => ({
  widthPx,
  heightPx,
  devicePixelRatio: 1,
});
const FULL_HD = screen(1920, 1080);
const NOW = new Date("2026-10-25T10:00:00.000Z");

describe("calibrationFrom", () => {
  it("gives one px per mm when the 640 px square measures 640 mm", () => {
    const r = calibrationFrom(640, { width: "640", height: "640" }, FULL_HD, NOW);
    expect(r).toEqual({
      ok: true,
      calibration: {
        version: 1,
        pxPerMmX: 1,
        pxPerMmY: 1,
        screen: FULL_HD,
        calibratedAt: "2026-10-25T10:00:00.000Z",
      },
    });
  });

  it("keeps separate X and Y factors for an unequal square", () => {
    const r = calibrationFrom(600, { width: "500", height: "750" }, FULL_HD, NOW);
    expect(r.ok && r.calibration.pxPerMmX).toBeCloseTo(1.2, 10);
    expect(r.ok && r.calibration.pxPerMmY).toBeCloseTo(0.8, 10);
  });

  it("refuses sizes under 50 mm and over 5000 mm with the field", () => {
    expect(calibrationFrom(600, { width: "49", height: "600" }, FULL_HD)).toEqual({
      ok: false,
      field: "width",
      reason: "range",
    });
    expect(calibrationFrom(600, { width: "600", height: "5001" }, FULL_HD)).toEqual({
      ok: false,
      field: "height",
      reason: "range",
    });
    expect(calibrationFrom(600, { width: "50", height: "5000" }, FULL_HD).ok).toBe(true);
  });

  it("refuses empty and non-numeric text", () => {
    expect(calibrationFrom(600, { width: "", height: "600" }, FULL_HD)).toEqual({
      ok: false,
      field: "width",
      reason: "invalid",
    });
    expect(calibrationFrom(600, { width: "600", height: "abc" }, FULL_HD)).toEqual({
      ok: false,
      field: "height",
      reason: "invalid",
    });
    expect(calibrationFrom(600, { width: "0", height: "600" }, FULL_HD)).toEqual({
      ok: false,
      field: "width",
      reason: "invalid",
    });
  });
});

describe("parseMeasuredMm", () => {
  it("reads Arabic digits, comma and the Arabic decimal mark like Latin text", () => {
    const expected = { ok: true, mm: 299.5 };
    expect(parseMeasuredMm("299.5")).toEqual(expected);
    expect(parseMeasuredMm("299,5")).toEqual(expected);
    expect(parseMeasuredMm("٢٩٩٫٥")).toEqual(expected);
  });

  it("refuses negative numbers, three decimals and mixed text", () => {
    for (const text of ["-300", "300.123", "3 00", "1e3"]) {
      expect(parseMeasuredMm(text)).toEqual({ ok: false, reason: "invalid" });
    }
  });
});

describe("nominalSquarePx", () => {
  it("fills 60 percent of the shorter side in steps of 10 px", () => {
    expect(nominalSquarePx(FULL_HD)).toBe(640);
    expect(nominalSquarePx(screen(1366, 768))).toBe(460);
  });

  it("never goes below 100 px", () => {
    expect(nominalSquarePx(screen(120, 90))).toBe(100);
  });
});
