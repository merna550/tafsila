import { DEFAULT_FABRIC_OPTIONS } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { FabricDoesNotFit, MarkerScene } from "@/shared/fabric-nesting";
import { DoesNotFitNotice } from "./DoesNotFitNotice";
import { FabricOptionsForm } from "./FabricOptionsForm";
import { FabricResults } from "./FabricResults";
import { MarkerDiagram } from "./MarkerDiagram";
import { NestingProgress } from "./NestingProgress";
import { optionsToForm } from "../model/fabric-form";
import type { CalcView } from "../model/calc-view";

const SCENE: MarkerScene = {
  kind: "main",
  layout: "folded",
  widthMm: 1800,
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
    { kind: "fold", d: "M0.00 0.00 L1800.00 0.00" },
    { kind: "selvedge", d: "M0.00 700.00 L1800.00 700.00" },
  ],
};
const VIEW: CalcView = {
  options: DEFAULT_FABRIC_OPTIONS,
  kinds: [
    { kind: "main", lengthM: 1.8, scene: SCENE },
    { kind: "lining", lengthM: 12, scene: null },
    { kind: "interfacing", lengthM: 0.6, scene: null },
  ],
  doesNotFit: [],
  suggestOpen: false,
  nestingVersion: "1.0.0",
};
const NOT_FIT: FabricDoesNotFit = {
  pieceId: "sleeve",
  fabric: "main",
  widthMm: 740,
  usableWidthMm: 700,
  fitsOpen: true,
  name: { ar: "الكم", en: "Sleeve" },
};
const noop = (): void => undefined;

describe("FabricOptionsForm", () => {
  const form = (values = optionsToForm(DEFAULT_FABRIC_OPTIONS), hasResult = false, errors = {}) => (
    <FabricOptionsForm
      values={values}
      errors={errors}
      busy={false}
      hasResult={hasResult}
      onChange={noop}
      onSubmit={noop}
    />
  );

  it("shows the five presets, custom, both layouts and the calculate button in English", () => {
    const html = renderWithIntl(form(), "en");
    for (const text of [
      ">90<",
      ">115<",
      ">140<",
      ">150<",
      ">160<",
      "Custom",
      "Folded",
      "Open",
      "Calculate fabric",
      "Shrinkage",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toMatch(/aria-pressed="true"[^>]*>140</);
  });

  it("shows the Arabic labels and the recalculate button when a result exists", () => {
    const html = renderWithIntl(form(undefined, true), "ar");
    for (const text of ["مخصّص", "مطوي", "مفتوح", "إعادة الحساب", "الانكماش"]) expect(html).toContain(text);
  });

  it("opens the custom width field and shows its error", () => {
    const values = optionsToForm({ ...DEFAULT_FABRIC_OPTIONS, widthMm: 1280 });
    const html = renderWithIntl(form(values, false, { customCm: "width" }), "en");
    expect(html).toContain("Custom width (cm)");
    expect(html).toContain("between 50 and 300 cm");
  });
});

describe("FabricResults", () => {
  it("shows metres per kind with one decimal and Western digits, in Arabic", () => {
    const html = renderWithIntl(<FabricResults view={VIEW} blocked={false} />, "ar");
    for (const text of [
      "1.8 م",
      "12.0 م",
      "0.6 م",
      "القماش الأساسي",
      "البطانة",
      "الحشوة اللاصقة",
      "عرض 140 سم، مطوي",
      "5٪",
    ]) {
      expect(html).toContain(text);
    }
  });

  it("shows a dash instead of a length when blocked", () => {
    const html = renderWithIntl(<FabricResults view={VIEW} blocked />, "en");
    expect(html).not.toContain("1.8 m");
    expect(html).toContain("Cannot calculate before the problem is solved");
  });
});

describe("DoesNotFitNotice", () => {
  it("names the piece and offers the open layout", () => {
    const html = renderWithIntl(<DoesNotFitNotice items={[NOT_FIT]} canTryOpen onTryOpen={noop} />, "en");
    expect(html).toContain("Sleeve");
    expect(html).toContain("70 cm");
    expect(html).toContain("Try the open layout");
    expect(html).toContain('role="alert"');
  });

  it("hides the button when the open layout would not help", () => {
    const html = renderWithIntl(
      <DoesNotFitNotice items={[NOT_FIT]} canTryOpen={false} onTryOpen={noop} />,
      "ar",
    );
    expect(html).toContain("الكم");
    expect(html).not.toContain("تجربة التوزيع المفتوح");
  });
});

describe("NestingProgress", () => {
  it("shows the step and Cancel", () => {
    const html = renderWithIntl(<NestingProgress stage="nest" slow={false} onCancel={noop} />, "en");
    expect(html).toContain("Placing the pieces");
    expect(html).toContain("Cancel");
    expect(html).not.toContain("longer than usual");
  });

  it("shows the slow hint", () => {
    expect(renderWithIntl(<NestingProgress stage={null} slow onCancel={noop} />, "en")).toContain(
      "longer than usual",
    );
  });
});

describe("MarkerDiagram", () => {
  it("draws the piece with its name, the fold and the selvedge, and has zoom buttons", () => {
    const html = renderWithIntl(<MarkerDiagram scene={SCENE} />, "en");
    for (const text of [
      "Front",
      "Fold",
      "Selvedge",
      'aria-label="Zoom in"',
      'aria-label="Zoom out"',
      "Reset zoom",
      "Usable width: 70 cm",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('viewBox="-60 -60 1920 820"');
    expect(html).toContain("M0.00 0.00 L400.00 0.00");
  });

  it("writes the piece names in Arabic", () => {
    expect(renderWithIntl(<MarkerDiagram scene={SCENE} />, "ar")).toContain("الأمام");
  });
});
