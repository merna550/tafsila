import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OptionCardGroup, toggleValue } from "./option-card-group";
import type { OptionCardOption } from "./option-card-group";

const OPTIONS: OptionCardOption[] = [
  { value: "a", label: "A" },
  { value: "b", label: "B", disabledReason: "Not for this neck" },
  { value: "c", label: "C", lowConfidence: true },
];

/**
 * Renders a single-choice group to markup.
 *
 * @param value - Chosen value.
 * @param extra - Extra props.
 * @param extra.dir - Reading direction.
 * @returns The HTML string.
 */
function single(value: string | undefined, extra: { dir?: "rtl" | "ltr" } = {}): string {
  return renderToStaticMarkup(
    <OptionCardGroup
      label="g"
      lowConfidenceLabel="Check"
      options={OPTIONS}
      value={value}
      onValueChange={vi.fn()}
      {...extra}
    />,
  );
}

describe("OptionCardGroup single", () => {
  it("is a radio group with the selected card checked", () => {
    const html = single("a");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="g"');
    expect(html).toMatch(/role="radio"[^>]*aria-checked="true"[^>]*>(?:(?!<button).)*A/s);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
  });

  it("passes the reading direction to the group", () => {
    expect(single("a", { dir: "rtl" })).toContain('dir="rtl"');
  });

  it("disables a card with a reason, shows the reason and links it", () => {
    const html = single(undefined);
    const button = /<button[^>]*>(?:(?!<\/button>).)*Not for this neck/s.exec(html)?.[0] ?? "";
    expect(button).toContain("disabled");
    const describedBy = /aria-describedby="([^"]+)"/.exec(button)?.[1];
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${describedBy}"`);
  });

  it("shows the low-confidence badge and attribute only on that card", () => {
    const html = single(undefined);
    expect(html).toContain("Check");
    expect(html.match(/data-low-confidence/g)).toHaveLength(1);
  });

  it("shows the check badge only on the selected card", () => {
    expect(single("a").match(/<svg/g)).toHaveLength(1);
    expect(single(undefined)).not.toContain("<svg");
  });
});

describe("OptionCardGroup multiple", () => {
  it("is a group of checkboxes with the chosen ones checked", () => {
    const html = renderToStaticMarkup(
      <OptionCardGroup multiple label="g" options={OPTIONS} value={["a", "c"]} onValueChange={vi.fn()} />,
    );
    expect(html).toContain('role="group"');
    expect(html.match(/role="checkbox"/g)).toHaveLength(3);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(2);
    expect(html).toContain("disabled");
  });
});

describe("toggleValue", () => {
  it("adds and removes while keeping the order of the options", () => {
    expect(toggleValue(OPTIONS, ["c"], "a")).toEqual(["a", "c"]);
    expect(toggleValue(OPTIONS, ["a", "c"], "a")).toEqual(["c"]);
    expect(toggleValue(OPTIONS, [], "c")).toEqual(["c"]);
  });
});
