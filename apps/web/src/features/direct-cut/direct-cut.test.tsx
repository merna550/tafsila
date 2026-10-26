import { cutPlanFixture } from "@tafsila/test-fixtures";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { CutPieceList } from "./components/CutPieceList";
import { DirectCutLink } from "./components/DirectCutLink";
import { PrintSheet } from "./components/PrintSheet";
import { StepList } from "./components/StepList";
import arMessages from "@messages/ar.json";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
  DIRECTION: { ar: "rtl", en: "ltr" },
}));

const front = cutPlanFixture.pieces[0];
const noop = (): void => undefined;

describe("CutPieceList", () => {
  it("shows each piece with its progress, in English", () => {
    const html = renderWithIntl(
      <CutPieceList
        plan={cutPlanFixture}
        currentId={front.pieceId}
        ticked={new Set([front.steps[0].id])}
        onChoose={noop}
      />,
      "en",
    );
    expect(html).toContain("Front");
    expect(html).toContain("Sleeve");
    expect(html).toContain("1 of 3");
    expect(html).toContain("0 of 2");
    expect(html).toContain('aria-current="true"');
  });

  it("uses the Arabic piece names and wording", () => {
    const html = renderWithIntl(
      <CutPieceList plan={cutPlanFixture} currentId={front.pieceId} ticked={new Set()} onChoose={noop} />,
      "ar",
    );
    expect(html).toContain("الأمام");
    expect(html).toContain(arMessages.directCut.storedLocally);
  });
});

describe("StepList", () => {
  it("renders the step text of the page language with unchecked boxes", () => {
    const en = renderWithIntl(<StepList piece={front} ticked={new Set()} onToggle={noop} />, "en");
    expect(en).toContain("Mark point A.");
    expect(en).not.toContain("وضعي");
    expect(en).toContain('aria-checked="false"');
    expect(en).not.toContain('aria-checked="true"');
    const ar = renderWithIntl(<StepList piece={front} ticked={new Set()} onToggle={noop} />, "ar");
    expect(ar).toContain("وضعي النقطة A.");
  });

  it("checks only the ticked steps", () => {
    const html = renderWithIntl(
      <StepList piece={front} ticked={new Set([front.steps[1].id])} onToggle={noop} />,
      "en",
    );
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
  });
});

describe("PrintSheet", () => {
  const sheet = <PrintSheet plan={cutPlanFixture} title="Dress" versionNo={3} sizeLabel="M" />;

  it("has one section per piece with empty boxes and the version and engine version", () => {
    const html = renderWithIntl(sheet, "en");
    expect(html.match(/data-testid="print-piece"/g)).toHaveLength(2);
    expect(html.match(/data-testid="print-box"/g)).toHaveLength(5);
    expect(html).toContain("Version 3 · engine 1.4.0");
    expect(html).toContain("Front · Cut 1 on the fold");
    expect(html).not.toContain("aria-checked");
    expect(html).not.toContain("direction");
  });

  it("prints in Arabic with the Arabic names", () => {
    const html = renderWithIntl(sheet, "ar");
    expect(html).toContain("الأمام");
    expect(html).toContain(arMessages.directCut.print.sizeLine.replace("{size}", "M"));
  });
});

describe("DirectCutLink", () => {
  it("links to the cut route", () => {
    const html = renderWithIntl(<DirectCutLink href="/designs/d/versions/v/cut" disabled={false} />, "en");
    expect(html).toContain('href="/designs/d/versions/v/cut"');
    expect(html).toContain("Direct cut");
  });

  it("is disabled with its reason when the version cannot be drawn", () => {
    const html = renderWithIntl(<DirectCutLink href="/x" disabled />, "en");
    expect(html).not.toContain('href="/x"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("cannot be drawn");
  });
});
