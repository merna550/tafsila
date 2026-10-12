import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChevronEndIcon, PlusIcon, SearchIcon } from "./icons";

describe("icons", () => {
  it("hides every icon from screen readers", () => {
    for (const icon of [<ChevronEndIcon key="c" />, <PlusIcon key="p" />, <SearchIcon key="s" />]) {
      expect(renderToStaticMarkup(icon)).toContain('aria-hidden="true"');
    }
  });

  it("flips the end chevron in right-to-left pages and keeps the caller's classes", () => {
    const html = renderToStaticMarkup(<ChevronEndIcon className="size-4" />);
    expect(html).toContain("rtl:-scale-x-100");
    expect(html).toContain("size-4");
  });
});
