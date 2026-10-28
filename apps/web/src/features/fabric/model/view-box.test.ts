import { describe, expect, it } from "vitest";
import { fullViewBox, viewBoxAttr, VIEW_PADDING_MM, zoomView, ZOOM_LIMITS, ZOOM_STEP } from "./view-box";

const FULL = fullViewBox(1800, 700);

describe("view box", () => {
  it("pads the strip on every side", () => {
    expect(FULL).toEqual({ x: -VIEW_PADDING_MM, y: -VIEW_PADDING_MM, width: 1920, height: 820 });
  });

  it("zooms in around the centre and back out to the first view", () => {
    const zoomed = zoomView(FULL, FULL, ZOOM_STEP);
    expect(zoomed.width).toBeCloseTo(FULL.width / ZOOM_STEP);
    expect(zoomed.x + zoomed.width / 2).toBeCloseTo(FULL.x + FULL.width / 2);
    const back = zoomView(zoomed, FULL, 1 / ZOOM_STEP);
    expect(back.width).toBeCloseTo(FULL.width);
    expect(back.x).toBeCloseTo(FULL.x);
  });

  it("never zooms out past the first view or in past the limit", () => {
    expect(zoomView(FULL, FULL, 0.1)).toEqual(FULL);
    let view = FULL;
    for (let i = 0; i < 20; i += 1) view = zoomView(view, FULL, ZOOM_STEP);
    expect(FULL.width / view.width).toBeCloseTo(ZOOM_LIMITS.max);
  });

  it("writes whole mm", () => {
    expect(viewBoxAttr({ x: -60.4, y: -59.6, width: 1920.2, height: 820.5 })).toBe("-60 -60 1920 821");
  });
});
