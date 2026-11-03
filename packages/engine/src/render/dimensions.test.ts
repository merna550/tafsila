import type { PatternResult } from "@tafsila/schemas";
import {
  dartedBlouse,
  rectanglePattern,
  SIZE_MATRIX,
  sizeM,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DIMENSION_WORDS } from "../constants/dimensions";
import { edgeCurve } from "../pieces/edge-curve";
import { edgeLengthMm, edgeSegments } from "../pieces/measure";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../pipeline";
import { curveText, formatCm } from "./dimensions";
import { expectSvgSnapshot } from "./expect-svg-snapshot";
import { DEFAULT_SVG_LAYERS, renderSvg, SVG_LAYERS } from "./svg";

/** Render options that draw every layer, the dimension layer included. */
const WITH_DIMENSIONS = { layers: SVG_LAYERS } as const;

/**
 * The text content of the element with this id.
 *
 * @param svg - The SVG text.
 * @param id - Element id.
 * @returns The text, or undefined when there is no such text element.
 */
function textOf(svg: string, id: string): string | undefined {
  return new RegExp(`<text id="${id}"[^>]*>([^<]*)</text>`).exec(svg)?.[1];
}

/**
 * Pattern for one size-matrix entry.
 *
 * @param spec - The design.
 * @param entry - The size matrix entry.
 * @returns The drafted pattern.
 */
function draft(spec: typeof dartedBlouse, entry: (typeof SIZE_MATRIX)[number]): PatternResult {
  return generatePattern(spec, entry.measurements, { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: entry.id });
}

describe("formatCm", () => {
  it("writes mm as cm with one decimal", () => {
    expect(formatCm(245)).toBe("24.5");
    expect(formatCm(245.4)).toBe("24.5");
    expect(formatCm(100)).toBe("10.0");
    expect(formatCm(0)).toBe("0.0");
  });
});

describe("the dimensions layer is optional", () => {
  it("is not drawn by default, so every existing print and snapshot stays as it was", () => {
    const svg = renderSvg(rectanglePattern);
    expect(svg).not.toContain("layer-dimensions");
    expect(DEFAULT_SVG_LAYERS).not.toContain("dimensions");
  });

  it("is drawn when asked for, and only its own group appears when it is the only layer", () => {
    const svg = renderSvg(rectanglePattern, { layers: ["dimensions"] });
    expect(svg).toContain('<g id="layer-dimensions">');
    expect(svg.match(/<g id="layer-/g)).toHaveLength(1);
  });

  it("changes nothing else: the other layers are byte for byte the default render", () => {
    const plain = renderSvg(rectanglePattern);
    const full = renderSvg(rectanglePattern, WITH_DIMENSIONS);
    expect(full.replace(/<g id="layer-dimensions">[\s\S]*?\n<\/g>\n/, "")).toBe(plain);
  });

  it("gives the same bytes for the same pattern", () => {
    expect(renderSvg(rectanglePattern, WITH_DIMENSIONS)).toBe(renderSvg(rectanglePattern, WITH_DIMENSIONS));
  });
});

describe("edge lengths", () => {
  it("writes the length in cm on every edge of the test rectangle", () => {
    const svg = renderSvg(rectanglePattern, WITH_DIMENSIONS);
    for (const piece of rectanglePattern.pieces) {
      for (const edge of piece.edges) {
        const written = textOf(svg, `piece-${piece.id}-dim-${edge.id}`);
        expect(written).toBe(formatCm(edgeLengthMm(piece, edge.id)));
      }
    }
  });

  it("marks no curve on a pattern of straight edges", () => {
    expect(renderSvg(rectanglePattern, WITH_DIMENSIONS)).not.toContain("-curve-");
  });

  it("matches the committed snapshot for a darted blouse", async () => {
    await expectSvgSnapshot(
      draft(
        dartedBlouse,
        SIZE_MATRIX.find((e) => e.id === "size-m")!,
      ),
      WITH_DIMENSIONS,
    );
  });
});

describe("curve markers", () => {
  const blouse = generatePattern(dartedBlouse, sizeM);
  const svg = renderSvg(blouse, WITH_DIMENSIONS);

  it("marks every curved edge with its depth, and no straight edge", () => {
    for (const piece of blouse.pieces) {
      for (const edge of piece.edges) {
        const curve = edgeCurve(edgeSegments(piece, edge.id));
        const marked = svg.includes(`id="piece-${piece.id}-curve-${edge.id}"`);
        expect(marked).toBe(curve !== undefined);
        if (curve) {
          expect(textOf(svg, `piece-${piece.id}-curve-${edge.id}-text`)).toBe(curveText(curve));
        }
      }
    }
  });

  it("finds curves on the neck and armhole of the blouse", () => {
    expect(svg).toContain("-curve-neck");
    expect(svg).toContain("-curve-armhole");
  });

  it("writes the depth of a curve in cm after the word for arc", () => {
    expect(svg).toMatch(new RegExp(`>${DIMENSION_WORDS.depth} \\d+\\.\\d<`));
  });

  it("writes a radius for a true circular arc, as on a circle skirt", () => {
    const dress = generatePattern(vNeckHalfCircleDress, sizeM);
    expect(renderSvg(dress, WITH_DIMENSIONS)).toContain(DIMENSION_WORDS.radius);
  });
});

describe("across the size matrix", () => {
  for (const entry of SIZE_MATRIX) {
    it(`gives each edge of the blouse and the circle-skirt dress exactly one length in ${entry.id}`, () => {
      for (const spec of [dartedBlouse, vNeckHalfCircleDress]) {
        const pattern = draft(spec, entry);
        const svg = renderSvg(pattern, { layers: ["dimensions"] });
        for (const piece of pattern.pieces) {
          for (const edge of piece.edges) {
            const id = `piece-${piece.id}-dim-${edge.id}`;
            const expected = edgeLengthMm(piece, edge.id) > 0 ? 1 : 0;
            expect(svg.split(`<text id="${id}"`).length - 1).toBe(expected);
          }
        }
      }
    });
  }
});
