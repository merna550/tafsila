import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("exposes its label as the accessible name", () => {
    const html = renderToStaticMarkup(<IconButton label="إغلاق">x</IconButton>);
    expect(html).toContain('aria-label="إغلاق"');
  });

  it("is a 44px square and ghost by default", () => {
    const html = renderToStaticMarkup(<IconButton label="a">x</IconButton>);
    expect(html).toContain("w-11");
    expect(html).toContain("min-h-11");
    expect(html).toContain("text-primary");
  });
});
