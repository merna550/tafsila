import { describe, expect, it } from "vitest";
import {
  FIT_MARGIN_PX,
  ZOOM_MAX,
  ZOOM_MIN,
  clampZoom,
  fitViewport,
  focusViewport,
  mmPerPx,
  panBy,
  pinch,
  zoomAt,
} from "./viewport";

const sheets = [
  { widthMm: 1200, heightMm: 900 },
  { widthMm: 300, heightMm: 2000 },
  { widthMm: 120, heightMm: 120 },
];
const screens = [
  { width: 360, height: 640 },
  { width: 1280, height: 800 },
];

describe("fitViewport", () => {
  it.each(screens)("fits every sheet whole inside $width x $height with a margin", (size) => {
    for (const sheet of sheets) {
      const vp = fitViewport(sheet, size);
      expect(vp.tx).toBeGreaterThanOrEqual(FIT_MARGIN_PX - 0.001);
      expect(vp.ty).toBeGreaterThanOrEqual(FIT_MARGIN_PX - 0.001);
      expect(vp.tx + sheet.widthMm * vp.zoom).toBeLessThanOrEqual(size.width - FIT_MARGIN_PX + 0.001);
      expect(vp.ty + sheet.heightMm * vp.zoom).toBeLessThanOrEqual(size.height - FIT_MARGIN_PX + 0.001);
    }
  });
});

describe("zoomAt", () => {
  it("keeps the point under the anchor fixed", () => {
    const vp = { zoom: 0.5, tx: 30, ty: -20 };
    const anchor = { x: 200, y: 120 };
    const mmUnder = { x: (anchor.x - vp.tx) / vp.zoom, y: (anchor.y - vp.ty) / vp.zoom };
    const next = zoomAt(vp, 3, anchor);
    expect(mmUnder.x * next.zoom + next.tx).toBeCloseTo(anchor.x);
    expect(mmUnder.y * next.zoom + next.ty).toBeCloseTo(anchor.y);
  });

  it("stops at the zoom limits", () => {
    const vp = { zoom: 1, tx: 0, ty: 0 };
    expect(zoomAt(vp, 1e9, { x: 0, y: 0 }).zoom).toBe(ZOOM_MAX);
    expect(zoomAt(vp, 1e-9, { x: 0, y: 0 }).zoom).toBe(ZOOM_MIN);
    expect(clampZoom(5)).toBe(5);
  });
});

describe("panBy and mmPerPx", () => {
  it("moves the content by the given pixels", () => {
    expect(panBy({ zoom: 2, tx: 1, ty: 2 }, 10, -5)).toEqual({ zoom: 2, tx: 11, ty: -3 });
  });

  it("is the inverse of the zoom", () => {
    expect(mmPerPx({ zoom: 4, tx: 0, ty: 0 })).toBe(0.25);
  });
});

describe("pinch", () => {
  const vp = { zoom: 1, tx: 0, ty: 0 };

  it("doubles the zoom when the fingers move twice as far apart", () => {
    const next = pinch(
      vp,
      [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ],
      [
        { x: 50, y: 100 },
        { x: 250, y: 100 },
      ],
    );
    expect(next.zoom).toBeCloseTo(2);
  });

  it("pans with the midpoint", () => {
    const next = pinch(
      vp,
      [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ],
      [
        { x: 130, y: 120 },
        { x: 230, y: 120 },
      ],
    );
    expect(next.zoom).toBeCloseTo(1);
    expect(next.tx).toBeCloseTo(30);
    expect(next.ty).toBeCloseTo(20);
  });

  it("ignores fingers that start on the same point", () => {
    expect(
      pinch(
        vp,
        [
          { x: 5, y: 5 },
          { x: 5, y: 5 },
        ],
        [
          { x: 0, y: 0 },
          { x: 90, y: 0 },
        ],
      ),
    ).toBe(vp);
  });
});

describe("focusViewport", () => {
  it("frames the box inside the container", () => {
    const size = { width: 360, height: 640 };
    const box = { x: 500, y: 300, widthMm: 100, heightMm: 60 };
    const vp = focusViewport(box, size);
    expect(box.x * vp.zoom + vp.tx).toBeGreaterThanOrEqual(0);
    expect((box.x + box.widthMm) * vp.zoom + vp.tx).toBeLessThanOrEqual(size.width);
    expect((box.y + box.heightMm) * vp.zoom + vp.ty).toBeLessThanOrEqual(size.height);
  });
});
