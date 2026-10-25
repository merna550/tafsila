import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { VersionRowView } from "../model/version-view";
import { ReadOnlyVersionBanner } from "./ReadOnlyVersionBanner";
import { VersionRow } from "./VersionRow";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const noop = (): void => undefined;
const CURRENT: VersionRowView = {
  id: "v2",
  versionNo: 2,
  isCurrent: true,
  status: "pass",
  saved: "today",
  by: "user",
  sizeLabel: "M",
  ease: "regular",
  engineChanged: false,
};
const OLD: VersionRowView = {
  ...CURRENT,
  id: "v1",
  versionNo: 1,
  isCurrent: false,
  status: "warn",
  engineChanged: true,
};

/**
 * Renders a row in English.
 *
 * @param row - The row view.
 * @returns The HTML.
 */
function html(row: VersionRowView): string {
  return renderWithIntl(
    <VersionRow row={row} openHref={`/designs/d1/versions/${row.id}`} onRestore={noop} />,
    "en",
  );
}

describe("VersionRow", () => {
  it("marks the current version and offers no restore for it", () => {
    const out = html(CURRENT);
    expect(out).toContain("Version 2");
    expect(out).toContain("Current");
    expect(out).toContain("Sound");
    expect(out).toContain('href="/designs/d1/versions/v2"');
    expect(out).not.toContain("restore-version");
    expect(out).not.toContain("engine-notice");
  });

  it("shows warn, restore and the older-engine notice for an old version", () => {
    const out = html(OLD);
    expect(out).toContain("Warning");
    expect(out).toContain("restore-version");
    expect(out).toContain("engine-notice");
    expect(out).not.toContain("Current");
  });

  it("speaks Arabic", () => {
    const out = renderWithIntl(<VersionRow row={OLD} openHref="/x" onRestore={noop} />, "ar");
    expect(out).toContain("نسخة 1");
    expect(out).toContain("استعادة");
  });
});

describe("ReadOnlyVersionBanner", () => {
  it("says view only and offers back and restore", () => {
    const out = renderWithIntl(<ReadOnlyVersionBanner backHref="/b" onRestore={noop} canRestore />, "en");
    expect(out).toContain("old version, view only");
    expect(out).toContain("Back to the newest");
    expect(out).toContain("Restore this version");
  });

  it("hides restore for the current version", () => {
    const out = renderWithIntl(
      <ReadOnlyVersionBanner backHref="/b" onRestore={noop} canRestore={false} />,
      "en",
    );
    expect(out).not.toContain("restore-this");
  });
});
