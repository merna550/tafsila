import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { CalibrationFormController } from "../model/controllers";
import type { CalibrationState } from "../model/calibration-store";
import { CalibrationView, type CalibrationViewProps } from "./CalibrationView";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const SCREEN = { widthPx: 1920, heightPx: 1080, devicePixelRatio: 1 };
const noop = (): void => undefined;
const FORM: CalibrationFormController = {
  width: "",
  height: "",
  setWidth: noop,
  setHeight: noop,
  widthError: null,
  heightError: null,
  storageError: false,
  submit: () => false,
};
const MISSING: CalibrationState = { status: "missing", calibration: null };

/**
 * Renders the view with defaults.
 *
 * @param over - Props to change.
 * @param locale - Page language.
 * @returns The HTML.
 */
function html(over: Partial<CalibrationViewProps> = {}, locale: "ar" | "en" = "ar"): string {
  return renderWithIntl(
    <CalibrationView
      backHref="/designs/d/versions/v"
      openHref="/designs/d/versions/v/projector"
      state={MISSING}
      screen={SCREEN}
      redoing={false}
      onRedo={noop}
      form={FORM}
      fullscreen={{ supported: false, isFullscreen: false, enter: noop, exit: noop }}
      onSubmit={noop}
      {...over}
    />,
    locale,
  );
}

describe("CalibrationView", () => {
  it("draws the square in px, left to right, and the form in Arabic", () => {
    const out = html();
    expect(out).toContain("width:640px;height:640px");
    expect(out).toContain('dir="ltr"');
    expect(out).toContain("معايرة البروجكتر");
    expect(out).toContain("العرض المقاس");
    expect(out).toContain("disabled");
  });

  it("shows a loading line and no square before the screen is known", () => {
    const out = html({ screen: null, state: { status: "loading", calibration: null } });
    expect(out).toContain("جارٍ التحميل");
    expect(out).not.toContain("calibration-square");
  });

  it("shows an error under each field", () => {
    const out = html({ form: { ...FORM, widthError: "range", heightError: "invalid" } }, "en");
    expect(out).toContain("Enter a size between 50 and 5000 mm.");
    expect(out).toContain("Enter a number greater than zero.");
  });

  it("asks to calibrate again when the stored calibration is stale", () => {
    const calibration = {
      version: 1 as const,
      pxPerMmX: 1,
      pxPerMmY: 1,
      screen: SCREEN,
      calibratedAt: "2026-10-25T10:00:00.000Z",
    };
    expect(html({ state: { status: "stale", calibration } }, "en")).toContain("Calibrate again");
  });

  it("shows the factors, the open link and the redo button once calibrated", () => {
    const calibration = {
      version: 1 as const,
      pxPerMmX: 1.0204,
      pxPerMmY: 0.9899,
      screen: SCREEN,
      calibratedAt: "2026-10-25T10:00:00.000Z",
    };
    const out = html({ state: { status: "ok", calibration } });
    expect(out).toContain("تمّت المعايرة");
    expect(out).toContain("1.02");
    expect(out).toContain("0.99");
    expect(out).toContain('href="/designs/d/versions/v/projector"');
    expect(out).toContain("إعادة المعايرة");
  });
});
