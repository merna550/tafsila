import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { DEFAULT_VIEWER_LAYERS } from "../hooks/use-viewer-state";
import { MEASURE_OFF } from "../model/measure";
import type { ViewerMeasure } from "../model/types";
import { MeasurePointList } from "./MeasurePointList";
import { MeasureReadout } from "./MeasureReadout";
import { PatternViewer } from "./PatternViewer";

const scene = buildPatternScene(generatePattern(seedDress, sizeM));
const all = scene.pieces.flatMap((p) => p.snapPoints);
const two: ViewerMeasure = {
  active: true,
  points: [
    { ...all[0]!, at: { x: 0, y: 0 } },
    { ...all[1]!, at: { x: 30, y: 40 } },
  ],
};

describe("MeasureReadout", () => {
  it("shows the distance in cm for two points, in both languages", () => {
    expect(renderWithIntl(<MeasureReadout measure={two} />, "en")).toContain("Distance: 5 cm");
    expect(renderWithIntl(<MeasureReadout measure={two} />, "ar")).toContain("المسافة: 5 سم");
    expect(renderWithIntl(<MeasureReadout measure={two} />, "en")).toContain('aria-live="polite"');
  });

  it("asks for the first point, and renders nothing while off", () => {
    expect(renderWithIntl(<MeasureReadout measure={{ active: true, points: [] }} />, "en")).toContain(
      "first point",
    );
    expect(renderWithIntl(<MeasureReadout measure={MEASURE_OFF} />, "en")).toBe("");
  });
});

describe("MeasurePointList", () => {
  it("has one option per snap point in each select", () => {
    const html = renderWithIntl(
      <MeasurePointList scene={scene} measure={{ active: true, points: [] }} onChange={() => undefined} />,
      "en",
    );
    expect(html.match(/<option value="[^"]+"/g)).toHaveLength(all.length * 2);
    expect(html).toContain('data-testid="measure-to"');
  });
});

describe("PatternViewer measure toggle", () => {
  it.each([false, true])("reports aria-pressed=%s", (active) => {
    const html = renderWithIntl(
      <PatternViewer
        scene={scene}
        layers={DEFAULT_VIEWER_LAYERS}
        selectedPieceId={null}
        onSelectPiece={() => undefined}
        highlight={[]}
        measure={{ active, points: [] }}
        onMeasureChange={() => undefined}
      />,
      "ar",
    );
    expect(html).toMatch(
      new RegExp(
        `aria-pressed="${active}"[^>]*data-testid="viewer-measure-toggle"|data-testid="viewer-measure-toggle"[^>]*aria-pressed="${active}"|aria-pressed="${active}"`,
      ),
    );
    expect(html.includes('data-layer="measure"')).toBe(active);
  });
});
