import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Input } from "./input";
import { Textarea } from "./textarea";

describe("Input", () => {
  it("passes native props and keeps a 44px height", () => {
    const html = renderToStaticMarkup(<Input placeholder="الاسم" disabled />);
    expect(html).toContain('placeholder="الاسم"');
    expect(html).toContain("disabled");
    expect(html).toContain("min-h-11");
  });

  it("styles the invalid state from aria-invalid", () => {
    expect(renderToStaticMarkup(<Input aria-invalid="true" />)).toContain("aria-invalid:border-danger");
  });
});

describe("Textarea", () => {
  it("renders three rows by default and accepts a value", () => {
    const html = renderToStaticMarkup(<Textarea defaultValue="ملاحظة" />);
    expect(html).toContain('rows="3"');
    expect(html).toContain("ملاحظة");
  });
});
