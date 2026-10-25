import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DesignRow } from "@/entities/design";
import { renderWithIntl } from "@/shared/i18n/testing";
import { DesignsFilters } from "./DesignsFilters";
import { DesignsHeading } from "./DesignsHeading";
import { DesignsList } from "./DesignsList";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const ROWS: DesignRow[] = [
  {
    id: "a",
    title: "فستان سهرة",
    category: "dress",
    clientName: "سلمى",
    updated: "أمس",
    versionCount: 3,
    status: "pass",
  },
  {
    id: "b",
    title: "تنورة قلم",
    category: "skirt",
    clientName: null,
    updated: "أمس",
    versionCount: 2,
    status: "warn",
  },
  {
    id: "c",
    title: "تنورة دائرية",
    category: "skirt",
    clientName: null,
    updated: "أمس",
    versionCount: 0,
    status: "none",
  },
];
const noop = (): void => undefined;

/**
 * Renders the list with defaults.
 *
 * @param rows - Rows to show.
 * @param hasMore - Whether more pages exist.
 * @returns The HTML.
 */
function renderList(rows: readonly DesignRow[], hasMore = false): string {
  return renderWithIntl(
    <DesignsList
      rows={rows}
      hasMore={hasMore}
      isLoadingMore={false}
      onLoadMore={noop}
      onClearFilters={noop}
      onDelete={noop}
    />,
  );
}

describe("DesignsList", () => {
  it("shows title, type, client, versions and status of each design with a link and a delete button", () => {
    const html = renderList(ROWS);
    expect(html).toContain('href="/designs/a"');
    expect(html).toContain("فستان سهرة");
    expect(html).toContain("العميلة: سلمى");
    expect(html).toContain("3 نسخ");
    expect(html).toContain("سليم");
    expect(html).toContain("فيه تنبيه");
    expect(html).toContain("بدون نسخة");
    expect(html).toContain("لا يوجد باترون");
    expect(html.match(/>حذف</g)).toHaveLength(3);
    expect(html).not.toContain("عرض المزيد");
  });

  it("offers more only when more pages exist", () => {
    expect(renderList(ROWS, true)).toContain("عرض المزيد");
  });

  it("shows no results with a clear action when nothing matches", () => {
    const html = renderList([]);
    expect(html).toContain("لا توجد نتائج");
    expect(html).toContain("مسح التصفية");
  });
});

describe("DesignsHeading", () => {
  it("shows the count and the action", () => {
    const html = renderWithIntl(<DesignsHeading total={5} action={<a href="/x">go</a>} />);
    expect(html).toContain("تصاميمي");
    expect(html).toContain("(5)");
    expect(html).toContain('href="/x"');
  });
});

describe("DesignsFilters", () => {
  it("renders a labelled search and a client select", () => {
    const html = renderWithIntl(
      <DesignsFilters
        text="فستان"
        onTextChange={noop}
        clients={[{ id: "c1", name: "سلمى" }]}
        clientId="c1"
        onClientChange={noop}
        dir="rtl"
      />,
    );
    expect(html).toContain('aria-label="البحث في التصاميم"');
    expect(html).toContain("تصفية حسب العميلة");
    expect(html).toContain('id="designs-client-filter"');
  });
});
