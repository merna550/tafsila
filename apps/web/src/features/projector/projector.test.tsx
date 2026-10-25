import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PatternScene } from "@tafsila/engine/viewer";
import { renderWithIntl } from "@/shared/i18n/testing";
import { UseVersionBar } from "@/features/pattern-versions";
import { KeyboardHelp } from "./components/KeyboardHelp";
import { ProjectorCanvas } from "./components/ProjectorCanvas";
import { ProjectorToolbar } from "./components/ProjectorToolbar";
import { DEFAULT_VIEW } from "./model/projector-view";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const noop = (): void => undefined;
const CAL = {
  version: 1 as const,
  pxPerMmX: 4,
  pxPerMmY: 4,
  screen: { widthPx: 1920, heightPx: 1080, devicePixelRatio: 1 },
  calibratedAt: "2026-10-25T10:00:00.000Z",
};
const PIECE = {
  id: "front",
  name: { ar: "الأمام", en: "Front" },
  cut: { quantity: 1 },
  bboxMm: { widthMm: 300, heightMm: 500 },
  cell: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },
  cutD: "M0 0 L300 0 L300 500 L0 500 Z",
  stitchD: "M10 10 L290 10 L290 490 L10 490 Z",
  grainD: "M150 50 L150 450",
  edges: [],
  notches: [{ id: "n1", edgeId: "e", d: "M0 250 h-8", at: { x: 0, y: 250 } }],
  darts: [],
  labels: [
    { id: "l1", text: { ar: "الأمام", en: "Front" }, at: { x: 150, y: 250 }, rotationDeg: 0, sizeMm: 12 },
  ],
  snapPoints: [],
};
const SCENE = {
  widthMm: 700,
  heightMm: 500,
  pieces: [PIECE, { ...PIECE, id: "back" }],
} as unknown as PatternScene;

/**
 * Renders the canvas.
 *
 * @param locale - Page language.
 * @returns The HTML.
 */
function canvas(locale: "ar" | "en"): string {
  return renderWithIntl(
    <ProjectorCanvas
      scene={SCENE}
      calibration={CAL}
      view={{ ...DEFAULT_VIEW, mirror: true }}
      viewport={{ widthPx: 1200, heightPx: 800 }}
      visiblePieceIds="all"
      placements={{}}
      activePieceId={null}
    />,
    locale,
  );
}

describe("ProjectorCanvas", () => {
  it.each(["ar", "en"] as const)("is left to right and has one group per piece in %s", (locale) => {
    const html = canvas(locale);
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('data-piece-id="front"');
    expect(html).toContain('data-piece-id="back"');
    expect(html).toContain('data-width-mm="300"');
  });

  it("puts the verification square outside the transformed pattern group", () => {
    const html = canvas("en");
    const group = html.indexOf('data-testid="pattern-group"');
    const groupEnd = html.indexOf('data-testid="verification-square"');
    expect(group).toBeGreaterThan(-1);
    expect(groupEnd).toBeGreaterThan(group);
    // The square is a sibling after the group closes, so no piece id follows it.
    expect(html.slice(groupEnd)).not.toContain("data-piece-id");
    expect(html).toContain('width="400"');
  });

  it("draws only the visible pieces", () => {
    const html = renderWithIntl(
      <ProjectorCanvas
        scene={SCENE}
        calibration={CAL}
        view={DEFAULT_VIEW}
        viewport={{ widthPx: 1200, heightPx: 800 }}
        visiblePieceIds={["back"]}
        placements={{}}
        activePieceId="back"
      />,
    );
    expect(html).not.toContain('data-piece-id="front"');
    expect(html).toContain('data-active="true"');
  });
});

describe("ProjectorToolbar and help", () => {
  it("shows Arabic controls in ar and English in en", () => {
    const props = {
      versionLine: "v",
      view: DEFAULT_VIEW,
      fullscreen: { supported: true, isFullscreen: false, enter: noop, exit: noop },
      recalibrateHref: "/r",
      exitHref: "/x",
      onMirror: noop,
      onLineWidth: noop,
      onColor: noop,
      onHelp: noop,
    };
    expect(renderWithIntl(<ProjectorToolbar {...props} />, "ar")).toContain("عكس");
    expect(renderWithIntl(<ProjectorToolbar {...props} />, "en")).toContain("Mirror");
  });

  it("lists every shortcut in a dialog", () => {
    const html = renderWithIntl(<KeyboardHelp onClose={noop} />, "en");
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Shift + ←");
  });
});

describe("UseVersionBar", () => {
  it("links to the projector and has a disabled twin with its reason on narrow screens", () => {
    const html = renderWithIntl(
      <UseVersionBar versionNo={3} engineVersion="1.4.0" projectorHref="/p" />,
      "en",
    );
    expect(html).toContain('href="/p"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("Open on a computer connected to the projector");
    expect(html).toContain("version 3, engine 1.4.0");
  });
});
