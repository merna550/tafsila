import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { DEFAULT_VIEWER_LAYERS } from "../hooks/use-viewer-state";
import { LayerToggles } from "./LayerToggles";
import { PieceList } from "./PieceList";
import { PiecePanel } from "./PiecePanel";
import { PatternViewer } from "./PatternViewer";

const scene = buildPatternScene(generatePattern(seedDress, sizeM));
const piece = scene.pieces[0]!;
const noop = (): void => undefined;

describe("PiecePanel", () => {
  it("shows the Arabic name in ar and the English name in en", () => {
    expect(renderWithIntl(<PiecePanel piece={piece} />, "ar")).toContain(piece.name.ar);
    expect(renderWithIntl(<PiecePanel piece={piece} />, "en")).toContain(piece.name.en);
  });

  it("lists every edge with its length and allowance", () => {
    const html = renderWithIntl(<PiecePanel piece={piece} />, "en");
    for (const e of piece.edges) expect(html).toContain(`data-testid="edge-row-${e.id}"`);
    expect(html).toContain(`${Math.round(piece.bboxMm.widthMm) / 10} cm`.replace(/\.0 /, " "));
  });

  it("shows the hint without a piece", () => {
    expect(renderWithIntl(<PiecePanel piece={null} />, "en")).toContain("Choose a piece");
  });

  it.each([
    [1, "قطعة واحدة"],
    [2, "قطعتان"],
    [3, "3 قطع"],
    [10, "10 قطع"],
    [11, "11 قطعة"],
  ])("writes the Arabic plural for %i copies", (count, text) => {
    const p = { ...piece, cut: { ...piece.cut, quantity: count, onFold: false, mirror: false } };
    expect(renderWithIntl(<PiecePanel piece={p} />, "ar")).toContain(text);
  });

  it("writes the fold cut text", () => {
    const p = { ...piece, cut: { ...piece.cut, quantity: 1, onFold: true } };
    expect(renderWithIntl(<PiecePanel piece={p} />, "en")).toContain("Cut 1 on fold");
    expect(renderWithIntl(<PiecePanel piece={p} />, "ar")).toContain("1 على الطيّة");
  });
});

describe("PieceList and LayerToggles", () => {
  it("lists every piece and marks the selected one", () => {
    const html = renderWithIntl(<PieceList scene={scene} selectedPieceId={piece.id} onSelect={noop} />, "en");
    for (const p of scene.pieces) expect(html).toContain(`data-testid="piece-list-${p.id}"`);
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
  });

  it("renders a checkbox per layer matching its state", () => {
    const html = renderWithIntl(
      <LayerToggles layers={{ ...DEFAULT_VIEWER_LAYERS, notches: false, grid: true }} onToggle={noop} />,
      "en",
    );
    expect(html).toMatch(/data-testid="layer-notches"/);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(4);
    expect(html.match(/aria-checked="false"/g)).toHaveLength(1);
  });

  it.each(["cut", "notches"] as const)("the viewer drops the %s layer when it is off", (layer) => {
    const html = renderWithIntl(
      <PatternViewer
        scene={scene}
        layers={{ ...DEFAULT_VIEWER_LAYERS, [layer]: false }}
        selectedPieceId={null}
        onSelectPiece={noop}
        highlight={[]}
        measure={{ active: false, points: [] }}
        onMeasureChange={noop}
      />,
      "en",
    );
    expect(html).not.toContain(`data-layer="${layer}"`);
  });
});
