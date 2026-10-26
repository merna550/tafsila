import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PatternVersionDetail } from "@tafsila/schemas";
import { clientApiError } from "@/shared/api";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { ExportKind, ExportState } from "@/shared/pattern-export";
import { ExportDialogBody, type ExportDialogBodyProps } from "./components/ExportDialogBody";
import { ExportButton } from "./components/ExportButton";
import { EXPORT_OPTIONS } from "./model/export-options";
import { exportSourceOf } from "./model/export-source";

vi.mock("@/shared/i18n", () => ({ DIRECTION: { ar: "rtl", en: "ltr" } }));
vi.mock("@/shared/error-display", () => ({ useApiErrorHandler: () => () => undefined }));

const noop = (): void => undefined;
const BASE: ExportDialogBodyProps = {
  state: { status: "idle" },
  kind: "a4",
  onKindChange: noop,
  onStart: noop,
  onCancel: noop,
  onClose: noop,
  onDownloadAgain: noop,
};

/**
 * Renders the body in one state and language.
 *
 * @param state - The export state.
 * @param locale - Language.
 * @param kind - The chosen file kind.
 * @returns The HTML.
 */
function body(state: ExportState, locale: "ar" | "en", kind: ExportKind = "a4"): string {
  const element: ReactElement = <ExportDialogBody {...BASE} kind={kind} state={state} />;
  return renderWithIntl(element, locale);
}

const VERSION = {
  id: "v1",
  versionNo: 3,
  engineVersion: "1.4.0",
  createdAt: "2026-10-01T10:00:00Z",
  spec: { category: "dress" },
  measurements: { bust: 900 },
  options: { fabricWidthMm: 1400 },
  easeProfile: "regular",
  sizeLabel: "M",
} as unknown as PatternVersionDetail["version"];

describe("ExportDialogBody", () => {
  it("offers A4 first, checked, then SVG, with the print note", () => {
    const html = body({ status: "idle" }, "en");
    expect(html.indexOf("Tiled A4")).toBeLessThan(html.indexOf("SVG"));
    expect(html).toMatch(
      /data-testid="export-option-a4"[^>]*checked|checked[^>]*data-testid="export-option-a4"/,
    );
    expect(html).toContain("Print at 100%");
    expect(html).toContain("10 cm");
    expect(html).toContain("Export</button>");
  });

  it("offers A0 between A4 and SVG in both languages", () => {
    const en = body({ status: "idle" }, "en");
    expect(en.indexOf("Tiled A4")).toBeLessThan(en.indexOf("A0 (copy shop)"));
    expect(en.indexOf("A0 (copy shop)")).toBeLessThan(en.indexOf(">SVG<"));
    expect(en).toContain("export-option-a0");
    const ar = body({ status: "idle" }, "ar");
    expect(ar).toContain("A0 (محل الطباعة)");
  });

  it("shows the copy-shop note once A0 is chosen", () => {
    const html = body({ status: "idle" }, "en", "a0");
    expect(html).toContain("Ask the copy shop to print at 100%");
    expect(html).not.toContain("Do not choose");
  });

  it("shows the Arabic copy of the design", () => {
    const html = body({ status: "idle" }, "ar");
    expect(html).toContain("A4 مقسّم");
    expect(html).toContain("اطبعي بحجم 100%");
    expect(html).toContain("إلغاء");
  });

  it("shows the progress with a bar and a Cancel button while running", () => {
    const html = body({ status: "running", kind: "a4", progress: { done: 7, total: 12 } }, "en");
    expect(html).toContain("Building the file: 7 of 12 pages");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="58"');
    expect(html).toContain('data-testid="export-cancel"');
    expect(html).not.toContain("export-option-a4");
  });

  it("shows a bar at zero before the first progress report", () => {
    const html = body({ status: "running", kind: "svg", progress: null }, "en");
    expect(html).toContain('aria-valuenow="0"');
  });

  it("says how many pages are ready and offers Download again", () => {
    const file = {
      fileName: "x-v3-A4.pdf",
      mime: "application/pdf",
      bytes: new ArrayBuffer(1),
      pageCount: 12,
    };
    const html = body({ status: "done", kind: "a4", file }, "en");
    expect(html).toContain("12 pages");
    expect(html).toContain("Download again");
    expect(html).toContain("Print at 100%");
  });

  it("does not show the print note for a finished SVG", () => {
    const file = { fileName: "x-v3.svg", mime: "image/svg+xml", bytes: new ArrayBuffer(1), pageCount: null };
    const html = body({ status: "done", kind: "svg", file }, "en");
    expect(html).not.toContain("Print at 100%");
  });

  it("shows the error as an alert with Try again", () => {
    const html = body({ status: "error", kind: "a4", error: clientApiError("unknown") }, "en");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Try again");
    expect(html).toContain("Close");
  });
});

describe("ExportButton", () => {
  it("is disabled with a visible reason when there is no saved version", () => {
    const html = renderWithIntl(<ExportButton source={null} />, "en");
    expect(html).toContain('disabled=""');
    expect(html).toContain("Save the version first to export it");
    expect(html).toContain('aria-describedby="export-disabled-reason"');
  });

  it("opens a dialog when there is a source", () => {
    const html = renderWithIntl(
      <ExportButton source={exportSourceOf({ version: VERSION, title: "فستان", clientLabel: "" })} />,
      "ar",
    );
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("تصدير");
    expect(html).not.toContain('disabled=""');
  });
});

describe("exportSourceOf and EXPORT_OPTIONS", () => {
  it("takes the stored inputs, the version number, the engine and the creation time", () => {
    const source = exportSourceOf({ version: VERSION, title: "فستان", clientLabel: "Nour" });
    expect(source.input.spec).toEqual({ category: "dress" });
    expect(source.input.options).toMatchObject({
      fabricWidthMm: 1400,
      easeProfile: "regular",
      sizeLabel: "M",
    });
    expect(source.meta).toEqual({
      title: "فستان",
      versionNo: 3,
      clientLabel: "Nour",
      engineVersion: "1.4.0",
      createdAt: "2026-10-01T10:00:00Z",
    });
  });

  it("lists A4, A0, then SVG", () => {
    expect(EXPORT_OPTIONS.map((o) => o.kind)).toEqual(["a4", "a0", "svg"]);
  });
});
