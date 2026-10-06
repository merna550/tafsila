import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a non-submitting button by default", () => {
    const html = renderToStaticMarkup(<Button>ابدئي</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain("ابدئي");
  });

  it("applies the requested variant", () => {
    expect(renderToStaticMarkup(<Button variant="secondary">x</Button>)).toContain("border-rose-700");
  });
});
