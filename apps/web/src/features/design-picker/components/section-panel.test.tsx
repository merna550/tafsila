import { defaultSpec, specOptions } from "@tafsila/engine/spec-rules";
import { designSpecSchema, type DesignSpec } from "@tafsila/schemas";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { EMPTY_EDITOR_STATE } from "../model/editor-state";
import { useEditorStore } from "../hooks/use-editor-store";
import { FIELDS_BY_SECTION, type FieldConfig } from "../model/section-fields";
import { sectionsFor, type SectionId } from "../model/sections";
import { SectionPanel } from "./SectionPanel";

vi.mock("@/shared/i18n", () => ({ DIRECTION: { ar: "rtl", en: "ltr" } }));

/**
 * Renders one section of a design.
 *
 * @param spec - The design.
 * @param section - The section.
 * @param locale - Language.
 * @returns The HTML.
 */
function render(spec: DesignSpec, section: SectionId, locale: "ar" | "en" = "ar"): string {
  return renderWithIntl(
    <SectionPanel
      title="T"
      section={section}
      spec={spec}
      options={specOptions(spec)}
      onChange={vi.fn()}
      onOverride={vi.fn()}
    />,
    locale,
  );
}

/**
 * A dress cut in one piece, which cannot take a gathered skirt.
 *
 * @returns The design.
 */
function onePieceDress(): DesignSpec {
  const dress = defaultSpec("dress");
  return { ...dress, bodice: { ...dress.bodice!, waistSeam: false } };
}

describe("SectionPanel", () => {
  it("shows a refused value disabled with the engine's Arabic reason", () => {
    const dress = onePieceDress();
    const html = render(dress, "skirt");
    const gathered = /<button[^>]*value="gathered"[^>]*>/.exec(html)?.[0] ?? "";
    expect(gathered).toContain("disabled");
    const reason = specOptions(dress)["skirt.type"].values.find((v) => v.value === "gathered")?.reason;
    expect(reason?.ar).toBeTruthy();
    expect(html).toContain(reason!.ar);
  });

  it("shows the engine's English reason in English", () => {
    const dress = onePieceDress();
    const reason = specOptions(dress)["skirt.type"].values.find((v) => v.value === "gathered")?.reason;
    expect(render(dress, "skirt", "en")).toContain(reason!.en);
  });

  it("shows the length fields only when they apply", () => {
    const skirt = defaultSpec("skirt");
    expect(render(skirt, "skirt")).toContain("طول التنورة");
    expect(render(skirt, "skirt")).not.toContain("طول الفتحة");
    const slit = { ...skirt, skirt: { ...skirt.skirt!, slit: { position: "back" as const, lengthMm: 300 } } };
    expect(render(slit, "skirt")).toContain("طول الفتحة");
    expect(render(defaultSpec("dress"), "neckline")).toContain("عمق الرقبة");
  });

  it("renders every section of every category in both languages", () => {
    for (const category of ["dress", "skirt", "blouse"] as const) {
      const spec = defaultSpec(category);
      for (const section of sectionsFor(specOptions(spec))) {
        for (const locale of ["ar", "en"] as const) expect(render(spec, section, locale)).toContain("<h2");
      }
    }
  });
});

/**
 * Sets every allowed value of one field and checks the design stays valid.
 *
 * @param category - The garment category, for the failure message.
 * @param start - The starting design.
 * @param field - The field.
 */
function expectAllValuesValid(
  category: string,
  start: DesignSpec,
  field: Exclude<FieldConfig, { kind: "number" }>,
): void {
  const options = specOptions(start)[field.path];
  if (!options.applies) return;
  const allowed = options.values.filter((v) => v.allowed);
  expect(allowed.length, `${category} ${field.path}`).toBeGreaterThan(0);
  for (const { value } of allowed) {
    useEditorStore.setState({ ...EMPTY_EDITOR_STATE });
    useEditorStore.getState().hydrate(`d-${category}`, start);
    useEditorStore.getState().setFeature(field.path, field.kind === "multi" ? [String(value)] : value);
    const ok = designSpecSchema.safeParse(useEditorStore.getState().spec).success;
    expect(ok, `${category} ${field.path}=${String(value)}`).toBe(true);
  }
}

describe("walking every value through the store", () => {
  beforeEach(() => useEditorStore.setState({ ...EMPTY_EDITOR_STATE }));

  it("keeps the design valid for every allowed value of every field of every section", () => {
    for (const category of ["dress", "skirt", "blouse"] as const) {
      const start = defaultSpec(category);
      const fields = sectionsFor(specOptions(start)).flatMap((section) => FIELDS_BY_SECTION[section]);
      for (const field of fields) {
        if (field.kind !== "number") expectAllValuesValid(category, start, field);
      }
    }
  });

  it("writes a typed length to the design and removes it when emptied", () => {
    const store = useEditorStore.getState();
    store.hydrate("d1", defaultSpec("skirt"));
    useEditorStore.getState().setOverride("skirt.lengthMm", 600);
    expect(useEditorStore.getState().spec?.skirt?.lengthMm).toBe(600);
    useEditorStore.getState().setOverride("skirt.lengthMm", undefined);
    expect(useEditorStore.getState().spec?.skirt?.lengthMm).toBeUndefined();
  });

  it("adds and removes pockets", () => {
    useEditorStore.getState().hydrate("d2", defaultSpec("skirt"));
    useEditorStore.getState().setFeature("pockets", ["patch", "side-seam"]);
    expect(useEditorStore.getState().spec?.pockets).toEqual(["patch", "side-seam"]);
    useEditorStore.getState().setFeature("pockets", ["side-seam"]);
    expect(useEditorStore.getState().spec?.pockets).toEqual(["side-seam"]);
  });
});
