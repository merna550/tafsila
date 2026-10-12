import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "./breadcrumb";

describe("Breadcrumb", () => {
  const items = [
    { key: "root", content: <a href="/clients">عميلاتي</a> },
    { key: "client", content: "سلمى عادل" },
  ];

  it("names the navigation and lists the steps in order", () => {
    const html = renderToStaticMarkup(<Breadcrumb label="مسار التنقل" items={items} />);
    expect(html).toContain('aria-label="مسار التنقل"');
    expect(html.indexOf("عميلاتي")).toBeLessThan(html.indexOf("سلمى عادل"));
  });

  it("marks only the last step as the current page and separates steps with a hidden slash", () => {
    const html = renderToStaticMarkup(<Breadcrumb label="x" items={items} />);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/aria-hidden="true">\//g)).toHaveLength(1);
  });
});
