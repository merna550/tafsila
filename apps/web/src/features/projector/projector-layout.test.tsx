import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { MarkerScene } from "@/shared/fabric-nesting";
import { ProjectorCanvas } from "./components/ProjectorCanvas";
import { layoutHref, markerToScene } from "./model/projector-mode";
import { DEFAULT_VIEW } from "./model/projector-view";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

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
const CAL = {
  version: 1 as const,
  pxPerMmX: 4,
  pxPerMmY: 4,
  screen: { widthPx: 1920, heightPx: 1080, devicePixelRatio: 1 },
  calibratedAt: "2026-10-25T10:00:00.000Z",
};

describe("ProjectorCanvas with a marker scene", () => {
  const html = renderWithIntl(
    <ProjectorCanvas
      scene={markerToScene(MARKER)}
      calibration={CAL}
      view={DEFAULT_VIEW}
      viewport={{ widthPx: 1200, heightPx: 800 }}
      visiblePieceIds="all"
      placements={{}}
      activePieceId={null}
    />,
    "en",
  );
  it("draws the fold and the selvedge as their own lines", () => {
    expect(html).toContain('data-layer="fold"');
    expect(html).toContain('data-layer="selvedge"');
    expect(html).toContain('d="M0.00 0.00 L3000.00 0.00"');
  });
  it("draws the placed shape like a pattern piece", () => {
    expect(html).toContain('data-piece-id="front#1"');
    expect(html).toContain('data-layer="cut"');
  });
});

describe("layoutHref", () => {
  it("points at the projector route with the fabric kind", () => {
    expect(layoutHref("d1", "v1", "lining")).toBe("/designs/d1/versions/v1/projector?layout=lining");
  });
});
