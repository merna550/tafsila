import { readFileSync } from "node:fs";
import type { PatternResult, Piece } from "@tafsila/schemas";
import { rectanglePattern } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { deepFreeze } from "../test-utils/deep-freeze";
import { expectSvgSnapshot } from "./expect-svg-snapshot";
import { SVG_FONT_FAMILY } from "./layers";
import { renderPrintSheet } from "./print-sheet";
import { renderSvg, SVG_LAYERS } from "./svg";

/**
 * Pattern with one piece changed.
 *
 * @param change - Fields to override on the rectangle piece.
 * @returns The new pattern.
 */
function withPiece(change: Partial<Piece>): PatternResult {
  return { ...rectanglePattern, pieces: [{ ...rectanglePattern.pieces[0]!, ...change }] };
}

describe("renderSvg determinism (NFR-08)", () => {
  it("gives byte-identical text for the same result", () => {
    expect(renderSvg(rectanglePattern)).toBe(renderSvg(rectanglePattern));
  });

  it("is the same for a deep copy and does not change a frozen input", () => {
    const frozen = deepFreeze(structuredClone(rectanglePattern));
    expect(renderSvg(frozen)).toBe(renderSvg(rectanglePattern));
  });
});

describe("the test rectangle", () => {
  it("matches the committed snapshot", async () => {
    await expectSvgSnapshot(rectanglePattern);
  });

  it("is written in mm with the cut path moved onto the sheet", () => {
    const svg = renderSvg(rectanglePattern);
    expect(svg).toMatch(/viewBox="0 0 [\d.]+ [\d.]+"/);
    expect(svg).toMatch(/width="[\d.]+mm" height="[\d.]+mm"/);
    expect(svg).toContain('d="M 20.00 20.00 L 250.00 20.00');
    expect(svg.match(/id="piece-front-panel-cut"/g)).toHaveLength(1);
    expect(svg.match(/-notch-n1"/g)).toHaveLength(1);
    expect(svg).toContain('d="M 237.50 185.00 L 232.50 185.00"');
  });

  it("draws the grain line with arrowheads", () => {
    const grain = /id="piece-front-panel-grain" d="([^"]+)"/.exec(renderSvg(rectanglePattern))![1]!;
    expect(grain.match(/M /g)).toHaveLength(3);
  });

  it("is the same sheet as the print sheet", () => {
    expect(renderPrintSheet(rectanglePattern)).toBe(renderSvg(rectanglePattern));
  });
});

describe("layers", () => {
  it("each layer name toggles exactly its group, in a fixed order", () => {
    for (const name of SVG_LAYERS) {
      const svg = renderSvg(rectanglePattern, { layers: [name] });
      expect(svg.match(/<g id="layer-/g)).toHaveLength(1);
      expect(svg).toContain(`<g id="layer-${name}">`);
    }
    const svg = renderSvg(rectanglePattern, { layers: ["labels", "cut"] });
    expect(svg.indexOf("layer-cut")).toBeLessThan(svg.indexOf("layer-labels"));
  });

  it("leaves out stitch and grain when only cut is asked for", () => {
    const svg = renderSvg(rectanglePattern, { layers: ["cut"] });
    expect(svg).not.toContain("piece-front-panel-stitch");
    expect(svg).not.toContain("piece-front-panel-grain");
  });

  it("draws darts as leg, apex, leg", () => {
    const pattern = withPiece({
      darts: [
        {
          id: "d1",
          edgeId: "side",
          apex: { x: 10, y: 10 },
          legs: [
            { x: 0, y: 40 },
            { x: 20, y: 40 },
          ],
        },
      ],
    });
    expect(renderSvg(pattern, { layers: ["darts"] })).toContain(
      'd="M 35.00 75.00 L 45.00 45.00 L 55.00 75.00"',
    );
  });

  it("refuses a notch on an unknown edge", () => {
    const pattern = withPiece({ notches: [{ id: "n9", edgeId: "nope", atMm: 1 }] });
    expect(() => renderSvg(pattern)).toThrow(DraftingError);
  });

  it("writes a curved piece with C commands and closes it", () => {
    const p = (x: number, y: number) => ({ x, y });
    const curve: Piece["cutPath"] = [
      { kind: "cubic", from: p(0, 0), c1: p(50, -20), c2: p(100, -20), to: p(150, 0) },
      { kind: "line", from: p(150, 0), to: p(150, 100) },
      { kind: "line", from: p(150, 100), to: p(0, 100) },
      { kind: "line", from: p(0, 100), to: p(0, 0) },
    ];
    const svg = renderSvg(withPiece({ cutPath: curve, stitchPath: curve, notches: [] }), { layers: ["cut"] });
    expect(svg).toContain(" C 70.00 15.00 120.00 15.00 170.00 35.00 L ");
    expect(svg).toContain(' Z"');
  });
});

describe("scale square and scale option", () => {
  it("is 100 x 100 mm", () => {
    expect(renderSvg(rectanglePattern)).toMatch(/<rect id="scale-square"[^>]*width="100.00" height="100.00"/);
  });

  it("scale changes the physical size only, not the viewBox or the square", () => {
    const half = renderSvg(rectanglePattern, { scale: 0.5 });
    const full = renderSvg(rectanglePattern);
    const view = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(full)!;
    expect(half).toContain(`viewBox="0 0 ${view[1]} ${view[2]}"`);
    expect(half).toContain(`width="${(Number(view[1]) / 2).toFixed(2)}mm"`);
    expect(half).toMatch(/id="scale-square"[^>]*width="100.00"/);
  });

  it("rejects a scale that is not positive", () => {
    expect(() => renderSvg(rectanglePattern, { scale: 0 })).toThrow(DraftingError);
  });

  it("renders just the scale square and grid for no pieces", () => {
    const svg = renderSvg({ ...rectanglePattern, pieces: [] });
    expect(svg).toContain('id="scale-square"');
    expect(svg).not.toContain("piece-");
  });
});

describe("labels", () => {
  it("writes Arabic text right to left with the font stack", () => {
    const svg = renderSvg(rectanglePattern);
    expect(svg).toContain(">الأمام</text>");
    expect(svg).toContain('direction="rtl"');
    expect(svg).toContain(`font-family='${SVG_FONT_FAMILY}'`);
  });

  it("escapes text and rotates around the label point", () => {
    const label = {
      ...rectanglePattern.pieces[0]!.labels[0]!,
      text: { ar: "a & <b>", en: "x" },
      rotationDeg: 90,
    };
    const svg = renderSvg(withPiece({ labels: [label] }), { layers: ["labels"] });
    expect(svg).toContain("a &amp; &lt;b&gt;");
    expect(svg).toContain('transform="rotate(90.00 135.00 185.00)"');
  });

  it("keeps the font stack in step with the design tokens", () => {
    const css = readFileSync(new URL("../../../ui/src/tokens.css", import.meta.url), "utf8");
    const tokens = /--font-sans:([^;]+);/.exec(css)![1]!;
    const names = (s: string): string[] =>
      s
        .replace(/var\(--font-plex, /, "")
        .replace(/\)/g, "")
        .split(",")
        .map((f) => f.trim().replace(/"/g, ""));
    expect(names(SVG_FONT_FAMILY).slice(0, 2)).toEqual(["IBM Plex Sans Arabic", "Noto Kufi Arabic"]);
    expect(names(tokens)).toEqual(expect.arrayContaining(names(SVG_FONT_FAMILY).slice(0, 2)));
  });
});
