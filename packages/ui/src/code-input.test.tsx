import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CodeInput, backspaceBox, editBox, extractDigits, pasteCode } from "./code-input";

const label = (index: number): string => `الرقم ${index + 1}`;

describe("extractDigits", () => {
  it.each([
    ["123456", "123456"],
    ["١٢٣٤٥٦", "123456"],
    ["۱۲۳", "123"],
    ["12 34-56", "123456"],
    ["abc", ""],
  ])("keeps the digits of %s", (input, expected) => {
    expect(extractDigits(input)).toBe(expected);
  });
});

describe("CodeInput", () => {
  it("renders one numeric box per digit, left-to-right, each with its own label", () => {
    const html = renderToStaticMarkup(<CodeInput value="48" onChange={vi.fn()} getBoxLabel={label} />);
    expect(html).toContain('dir="ltr"');
    expect(html.match(/<input/g)).toHaveLength(6);
    expect(html).toContain('aria-label="الرقم 1"');
    expect(html).toContain('aria-label="الرقم 6"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('value="4"');
    expect(html).toContain('value="8"');
  });

  it("offers the SMS autofill on the first box only and passes the field ids on", () => {
    const html = renderToStaticMarkup(
      <CodeInput value="" onChange={vi.fn()} getBoxLabel={label} id="code" aria-invalid length={4} />,
    );
    expect(html.match(/autoComplete="one-time-code"/g)).toHaveLength(1);
    expect(html).toContain('id="code"');
    expect(html.match(/aria-invalid="true"/g)).toHaveLength(4);
    expect(html.match(/<input/g)).toHaveLength(4);
  });
});

describe("editing the boxes", () => {
  it("replaces the digit of a box and moves to the next one", () => {
    expect(editBox("12", 1, "9", 6)).toEqual({ value: "19", focus: 2 });
  });

  it("clears a box when its text is removed", () => {
    expect(editBox("123", 1, "", 6)).toEqual({ value: "13", focus: 1 });
  });

  it("fills the next boxes when several digits arrive at once, and stops at the last box", () => {
    expect(editBox("", 0, "123456", 6)).toEqual({ value: "123456", focus: 5 });
    expect(editBox("1234", 4, "567", 6)).toEqual({ value: "123456", focus: 5 });
  });

  it("converts Arabic-Indic digits and ignores letters", () => {
    expect(editBox("", 0, "٤٨", 6)).toEqual({ value: "48", focus: 2 });
    expect(editBox("1", 1, "x", 6)).toEqual({ value: "1", focus: 1 });
  });

  it("removes the previous digit on Backspace in an empty box", () => {
    expect(backspaceBox("12", 2)).toEqual({ value: "1", focus: 1 });
    expect(backspaceBox("", 0)).toEqual({ value: "", focus: 0 });
  });

  it("fills all boxes from a pasted code, and ignores text without digits", () => {
    expect(pasteCode("١٢٣ ٤٥٦", 6)).toEqual({ value: "123456", focus: 5 });
    expect(pasteCode("1234567890", 6)).toEqual({ value: "123456", focus: 5 });
    expect(pasteCode("abc", 6)).toBeNull();
  });
});
