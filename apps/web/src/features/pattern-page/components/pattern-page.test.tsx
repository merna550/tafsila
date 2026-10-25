import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { SaveKind } from "../model/save-state";
import { SaveStatusBadge } from "./SaveStatusBadge";
import { SaveVersionBar } from "./SaveVersionBar";

const noop = (): void => undefined;
const KINDS: readonly SaveKind[] = [
  "loading",
  "no-set",
  "previewing",
  "preview-error",
  "server-rejected",
  "fail",
  "saving",
  "saved",
  "outdated",
  "unsaved",
];

/**
 * Tells whether the rendered save button is disabled.
 *
 * @param kind - The save state kind.
 * @returns True when the button carries `disabled`.
 */
function buttonDisabled(kind: SaveKind): boolean {
  const html = renderWithIntl(<SaveVersionBar state={{ kind, versionNo: 2 }} onSave={noop} />, "en");
  return /<button[^>]*\sdisabled=""/.test(html);
}

describe("SaveVersionBar", () => {
  it("is off for no-set, previewing, fail, error, rejected, saving and saved", () => {
    for (const kind of [
      "no-set",
      "previewing",
      "preview-error",
      "server-rejected",
      "fail",
      "saving",
      "saved",
    ] as const) {
      expect(buttonDisabled(kind), kind).toBe(true);
    }
  });

  it("is on for unsaved and outdated, and hidden while loading", () => {
    expect(buttonDisabled("unsaved")).toBe(false);
    expect(buttonDisabled("outdated")).toBe(false);
    expect(renderWithIntl(<SaveVersionBar state={{ kind: "loading" }} onSave={noop} />, "en")).toBe("");
  });

  it("says why Save is off, in both languages", () => {
    const state = { kind: "outdated", versionNo: 3 } as const;
    expect(renderWithIntl(<SaveVersionBar state={state} onSave={noop} />, "en")).toContain("since version 3");
    expect(renderWithIntl(<SaveVersionBar state={{ kind: "no-set" }} onSave={noop} />, "ar")).toContain(
      "الخيارات",
    );
  });
});

describe("SaveStatusBadge", () => {
  it("renders a label for every state but loading", () => {
    for (const kind of KINDS) {
      const html = renderWithIntl(<SaveStatusBadge state={{ kind, versionNo: 4 }} />, "en");
      expect(html === "", kind).toBe(kind === "loading");
    }
  });

  it("shows the version in the outdated label", () => {
    const html = renderWithIntl(<SaveStatusBadge state={{ kind: "outdated", versionNo: 3 }} />, "en");
    expect(html).toContain("Changed since version 3");
    expect(html).toContain('data-kind="outdated"');
  });
});
