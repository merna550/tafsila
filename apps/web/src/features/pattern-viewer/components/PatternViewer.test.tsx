import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { DEFAULT_VIEWER_LAYERS } from "../hooks/use-viewer-state";
import type { ViewerMeasure } from "../model/types";
import { PatternViewer } from "./PatternViewer";

const scene = buildPatternScene(generatePattern(seedDress, sizeM));
const idle: ViewerMeasure = { active: false, points: [] };

/**
 * Renders the viewer with chosen props.
 *
 * @param props - Props to override.
 * @param props.layers - Layers to show.
 * @param props.selected - Selected piece.
 * @param props.locale - Language.
 * @returns The HTML.
 */
function render(
  props: { layers?: typeof DEFAULT_VIEWER_LAYERS; selected?: string | null; locale?: "ar" | "en" } = {},
): string {
  return renderWithIntl(
    <PatternViewer
      scene={scene}
      layers={props.layers ?? DEFAULT_VIEWER_LAYERS}
      selectedPieceId={props.selected ?? null}
      onSelectPiece={() => undefined}
      highlight={[{ pieceId: scene.pieces[0]!.id, edgeId: scene.pieces[0]!.edges[0]!.id }]}
      measure={idle}
      onMeasureChange={() => undefined}
    />,
    props.locale ?? "ar",
  );
}

describe("PatternViewer markup", () => {
  it("has a group for every piece and a path for every edge", () => {
    const html = render();
    for (const piece of scene.pieces) {
      expect(html).toContain(`data-piece-id="${piece.id}"`);
      for (const edge of piece.edges) expect(html).toContain(`data-edge-id="${edge.id}"`);
    }
  });

  it("removes a layer's group when the layer is off", () => {
    const html = render({ layers: { ...DEFAULT_VIEWER_LAYERS, stitch: false, labels: false } });
    expect(html).not.toContain('data-layer="stitch"');
    expect(html).not.toContain("data-edge-id");
    expect(html).not.toContain('data-layer="labels"');
    expect(html).toContain('data-layer="cut"');
    expect(render({ layers: { ...DEFAULT_VIEWER_LAYERS, grid: true } })).toContain('data-layer="grid"');
  });

  it("marks the selected piece and the highlighted edge", () => {
    const html = render({ selected: scene.pieces[1]!.id });
    expect(html).toMatch(new RegExp(`data-piece-id="${scene.pieces[1]!.id}" data-selected="true"`));
    expect(html).toContain('data-highlighted="true"');
  });

  it.each(["ar", "en"] as const)("keeps the canvas left to right in %s", (locale) => {
    expect(render({ locale })).toMatch(/^<div dir="ltr"/);
  });

  it("writes the controls in Arabic in ar and English in en", () => {
    expect(render({ locale: "ar" })).toContain("ملاءمة الشاشة");
    expect(render({ locale: "en" })).toContain("Fit to screen");
  });
});

/**
 * Source files below a folder, tests excluded.
 *
 * @param dir - Folder to walk.
 * @returns Paths of `.ts` and `.tsx` files.
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

/** Worker-only files that may sample a path: the preview worker's cut-plan adapter (#291) never reaches a page bundle (`scripts/check-engine-chunk.mjs` checks it). */
const WORKER_ONLY = ["shared/pattern-preview/cut-plan.ts"];

describe("no geometry in the web app", () => {
  it("never imports the engine geometry or samples a path", () => {
    const root = join(__dirname, "../../..");
    for (const file of sources(root).filter((f) => !WORKER_ONLY.some((w) => f.endsWith(w)))) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/@tafsila\/engine\/geometry/);
      expect(text, file).not.toMatch(/\bsamplePath\b/);
    }
  });
});
