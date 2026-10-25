import type { DesignListItem } from "@tafsila/schemas";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { toDesignRow } from "./design-row";
import { NewPatternLink, newPatternHref } from "./NewPatternLink";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const NOW = new Date("2026-10-20T10:00:00.000Z");

/**
 * Builds a list item for the tests.
 *
 * @param summary - Summary fields to override.
 * @returns The item.
 */
function item(summary: Partial<DesignListItem["summary"]> = {}): DesignListItem {
  return {
    id: "00000000-0000-4000-8000-0000000000d1",
    category: "dress",
    title: "فستان سهرة",
    currentVersionId: null,
    createdAt: "2026-10-19T10:00:00.000Z",
    updatedAt: "2026-10-19T10:00:00.000Z",
    summary: { versionCount: 2, currentStatus: "warn", clientName: "سلمى", ...summary },
  };
}

describe("NewPatternLink", () => {
  it("carries the client id in the address", () => {
    expect(newPatternHref("abc")).toBe("/designs/new?clientId=abc");
    expect(renderWithIntl(<NewPatternLink clientId="abc" />, "en")).toContain(
      'href="/designs/new?clientId=abc"',
    );
  });

  it("has no query without a client and uses the label", () => {
    expect(newPatternHref()).toBe("/designs/new");
    const html = renderWithIntl(<NewPatternLink label="Go" variant="secondary" />, "en");
    expect(html).toContain('href="/designs/new"');
    expect(html).toContain("Go");
  });
});

describe("toDesignRow", () => {
  it("maps the summary and a relative time", () => {
    const row = toDesignRow(item(), NOW, "en");
    expect(row).toMatchObject({ title: "فستان سهرة", clientName: "سلمى", versionCount: 2, status: "warn" });
    expect(row.updated).toBe("yesterday");
  });

  it("shows a design without a version as status none", () => {
    expect(
      toDesignRow(item({ versionCount: 0, currentStatus: null, clientName: null }), NOW, "en"),
    ).toMatchObject({
      status: "none",
      clientName: null,
    });
  });
});
