import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
  it("is decorative without a label", () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });

  it("is an image with the given name", () => {
    const html = renderToStaticMarkup(<Logo label="Tafsila" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Tafsila"');
  });
});
