import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Link } from "./link";

describe("Link", () => {
  it("renders an anchor with token classes", () => {
    const html = renderToStaticMarkup(<Link href="/a">رابط</Link>);
    expect(html).toContain('href="/a"');
    expect(html).toContain("text-primary");
  });

  it("styles the child instead of an anchor with asChild", () => {
    const html = renderToStaticMarkup(
      <Link asChild>
        <span>x</span>
      </Link>,
    );
    expect(html.startsWith("<span")).toBe(true);
    expect(html).toContain("underline");
  });
});
