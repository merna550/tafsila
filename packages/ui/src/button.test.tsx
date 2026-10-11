import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a non-submitting button by default", () => {
    const html = renderToStaticMarkup(<Button>ابدئي</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain("ابدئي");
  });

  it("applies the requested variant with token classes", () => {
    const html = renderToStaticMarkup(<Button variant="secondary">x</Button>);
    expect(html).toContain("border-border");
    expect(html).not.toContain("rose-");
  });

  it("keeps a 44px touch target and merges extra classes", () => {
    const html = renderToStaticMarkup(<Button className="ms-4">x</Button>);
    expect(html).toContain("min-h-11");
    expect(html).toContain("ms-4");
  });
});
