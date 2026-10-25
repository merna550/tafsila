import { EASE_TOTAL_MM } from "@tafsila/engine/measurements";
import type { Client, MeasurementSet } from "@tafsila/schemas";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { defaultPatternOptions } from "../model/pattern-options";
import { PatternOptionsPanel } from "../PatternOptionsPanel";
import { CmField } from "./CmField";
import { ClientSetPicker } from "./ClientSetPicker";
import { EasePreference } from "./EasePreference";
import { SeamAllowanceFields } from "./SeamAllowanceFields";

vi.mock("@/shared/i18n", () => ({
  DIRECTION: { ar: "rtl", en: "ltr" },
  Link: ({ href, children }: { href: string; children: string }) => <a href={href}>{children}</a>,
}));
vi.mock("../hooks/use-selected-option-sources", () => ({
  usePickerSources: () => ({ clients: [], sets: [], setsLoading: false, clientsFailed: false }),
}));

const client = { id: "c1", name: "سلمى عادل" } as Client;
const set = (id: string, label: string, warnings: MeasurementSet["warnings"] = []) =>
  ({ id, label, warnings }) as MeasurementSet;
const warning = {
  code: "W",
  fields: ["waist"],
  message_ar: "الخصر أكبر من الورك",
  message_en: "Waist above hip",
};

/**
 * Renders the picker with a client and sets.
 *
 * @param sets - The sets.
 * @param locale - Language.
 * @returns The HTML.
 */
function picker(sets: MeasurementSet[], locale: "ar" | "en" = "ar"): string {
  return renderWithIntl(
    <ClientSetPicker
      clients={[client]}
      clientId="c1"
      sets={sets}
      setId={sets[0]?.id ?? null}
      setsLoading={false}
      onClient={vi.fn()}
      onSet={vi.fn()}
    />,
    locale,
  );
}

describe("ClientSetPicker", () => {
  it("labels both dropdowns and says the newest set comes first", () => {
    const html = picker([set("s1", "صيف 2026"), set("s0", "شتاء")]);
    expect(html).toContain("العميلة");
    expect(html).toContain("مجموعة القياسات");
    expect(html).toContain("الأحدث أولاً.");
    expect(html.match(/role="combobox"/g)).toHaveLength(2);
  });

  it("shows the set's warnings in the page language", () => {
    expect(picker([set("s1", "a", [warning])])).toContain(warning.message_ar);
    expect(picker([set("s1", "a", [warning])], "en")).toContain(warning.message_en);
  });

  it("links a client without sets to the new measurement form", () => {
    expect(picker([])).toContain('href="/clients/c1/measurements/new"');
  });
});

describe("EasePreference", () => {
  it.each(["fitted", "regular", "loose"] as const)("shows the engine's %s ease", (profile) => {
    const html = renderWithIntl(<EasePreference value={profile} onChange={vi.fn()} />, "en");
    const table = EASE_TOTAL_MM[profile];
    expect(html).toContain(`bust ${table.bust / 10}, waist ${table.waist / 10}, hip ${table.hip / 10}`);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it("marks the suggested values only for fitted and loose", () => {
    expect(renderWithIntl(<EasePreference value="regular" onChange={vi.fn()} />, "en")).not.toContain(
      "Suggested",
    );
    expect(renderWithIntl(<EasePreference value="loose" onChange={vi.fn()} />, "en")).toContain("Suggested");
  });
});

describe("SeamAllowanceFields", () => {
  const value = defaultPatternOptions().seamAllowanceMm;

  it("shows each allowance in cm with its default in the hint", () => {
    const html = renderWithIntl(
      <SeamAllowanceFields
        valueMm={{ ...value, hem: 25 }}
        isDefault={false}
        onChange={vi.fn()}
        onResetAll={vi.fn()}
      />,
      "en",
    );
    expect(html).toContain('value="2.5"');
    expect(html).toContain("Default 3");
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Reset all/);
  });

  it("disables reset all at the defaults", () => {
    const html = renderWithIntl(
      <SeamAllowanceFields valueMm={value} isDefault onChange={vi.fn()} onResetAll={vi.fn()} />,
      "en",
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Reset all/);
  });
});

describe("CmField and the panel", () => {
  it("shows the limits and default hint", () => {
    const html = renderWithIntl(
      <CmField
        label="Fabric"
        valueMm={1400}
        limit={{ minMm: 500, maxMm: 3000 }}
        defaultMm={1400}
        onChange={vi.fn()}
      />,
      "en",
    );
    expect(html).toContain("From 50 to 300 cm · Default 140");
    expect(html).toContain('value="140"');
  });

  it("disables save until a client and a set are chosen", () => {
    const html = renderWithIntl(
      <PatternOptionsPanel value={defaultPatternOptions()} onChange={vi.fn()} onSave={vi.fn()} />,
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>حفظ الخيارات/);
  });

  it("hides the save button without a save handler", () => {
    expect(
      renderWithIntl(<PatternOptionsPanel value={defaultPatternOptions()} onChange={vi.fn()} />),
    ).not.toContain("حفظ الخيارات");
  });
});
