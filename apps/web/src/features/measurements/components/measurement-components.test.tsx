import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { ALL_FIELDS } from "../model/field-groups";
import { FieldGroup } from "./FieldGroup";
import { GuideBody } from "./GuideDialog";
import { MeasurementField } from "./MeasurementField";
import { SaveBar } from "./SaveBar";
import { SizePicker } from "./SizePicker";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const noop = (): void => undefined;
const BASE = { size: "M", cm: "74" };

describe("MeasurementField", () => {
  it("shows the unit, the guide link and nothing else for an untouched box", () => {
    const html = renderWithIntl(
      <MeasurementField
        field="bust"
        inputProps={{ name: "fields.bust" }}
        changed={false}
        baseValue={BASE}
        onReset={noop}
        onGuide={noop}
      />,
    );
    expect(html).toContain("محيط الصدر");
    expect(html).toContain("كيف أقيس؟");
    expect(html).toContain("سم");
    expect(html).not.toContain("معدَّل");
    expect(html).not.toContain('role="alert"');
  });

  it("marks an adjusted box and offers to reset it to the size's value", () => {
    const html = renderWithIntl(
      <MeasurementField
        field="waist"
        inputProps={{}}
        changed
        baseValue={BASE}
        onReset={noop}
        onGuide={noop}
        warning="الخصر أعرض من الورك."
      />,
    );
    expect(html).toContain("معدَّل");
    expect(html).toContain("العودة إلى قيمة M (74)");
    expect(html).toContain("الخصر أعرض من الورك.");
    expect(html).not.toContain('aria-invalid="true"');
    expect(html).not.toContain('role="alert"');
  });

  it("shows an error as an alert and marks the box invalid, in English too", () => {
    const html = renderWithIntl(
      <MeasurementField
        field="highBust"
        inputProps={{}}
        changed={false}
        baseValue={BASE}
        onReset={noop}
        onGuide={noop}
        error="Must be smaller than the bust."
      />,
      "en",
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Must be smaller than the bust.");
    expect(html).toContain("cm");
  });
});

describe("SizePicker", () => {
  it("shows the chips with the picked one checked, the hint and the chart name", () => {
    const html = renderWithIntl(
      <SizePicker sizes={["S", "M", "L"]} value="M" onPick={noop} chartName="PLACEHOLDER chart" />,
    );
    expect(html.match(/role="radio"/g)).toHaveLength(3);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("وتبقى بقية القياسات من M.");
    expect(html).toContain("PLACEHOLDER chart");
  });
});

describe("SaveBar", () => {
  it("is disabled and says how many errors block saving", () => {
    const html = renderWithIntl(
      <SaveBar canSave={false} pending={false} errorCount={1} cancelHref="/clients/a" />,
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain("يوجد خطأ واحد يجب تصحيحه قبل الحفظ");
    expect(html).toContain('href="/clients/a"');
  });

  it("asks to fill the required boxes when nothing is wrong yet but saving is not possible", () => {
    const html = renderWithIntl(
      <SaveBar canSave={false} pending={false} errorCount={0} cancelHref="/x" />,
      "en",
    );
    expect(html).toContain("Fill in the required measurements before saving");
  });

  it("is enabled and quiet when saving is allowed", () => {
    const html = renderWithIntl(<SaveBar canSave pending={false} errorCount={0} cancelHref="/x" />);
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('role="status"');
  });
});

describe("FieldGroup", () => {
  it("folds to a summary row but keeps the boxes in the page", () => {
    const html = renderWithIntl(
      <FieldGroup id="arms" count={3} size="M" defaultOpen={false} hasIssue={false}>
        <input name="armLength" />
      </FieldGroup>,
    );
    expect(html).toContain("3 قياسات من M");
    expect(html).toContain("hidden");
    expect(html).toContain('name="armLength"');
  });

  it("stays open when a box inside has a problem", () => {
    const html = renderWithIntl(
      <FieldGroup id="arms" count={3} defaultOpen={false} hasIssue>
        <input name="armLength" />
      </FieldGroup>,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain("قياسات من");
  });
});

describe("GuideBody", () => {
  it.each(ALL_FIELDS)("renders the drawing, the steps and the warning of %s in both languages", (field) => {
    for (const locale of ["ar", "en"] as const) {
      const html = renderWithIntl(<GuideBody field={field} />, locale);
      expect(html).toContain("<svg");
      expect(html).toContain("<ol");
      expect(html.match(/<li/g)?.length).toBeGreaterThanOrEqual(3);
    }
  });
});
