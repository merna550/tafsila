import { defaultSpec, specOptions } from "@tafsila/engine/spec-rules";
import { describe, expect, it } from "vitest";
import { SECTION_ORDER, isSectionId, sectionsFor } from "./sections";
import { customisedSections } from "./spec-summary";
import { editorHref, parseEditorQuery } from "./editor-query";
import { setFeatureState, hydrateState } from "./editor-state";

describe("sectionsFor", () => {
  it("gives a skirt no bodice, neckline or sleeve", () => {
    const sections = sectionsFor(specOptions(defaultSpec("skirt")));
    for (const gone of ["bodice", "neckline", "sleeve"] as const) expect(sections).not.toContain(gone);
    expect(sections).toContain("skirt");
  });

  it("gives a blouse no skirt", () => {
    expect(sectionsFor(specOptions(defaultSpec("blouse")))).not.toContain("skirt");
  });

  it("gives a dress every section except the waistband (that is for skirts)", () => {
    expect(sectionsFor(specOptions(defaultSpec("dress")))).toEqual(
      SECTION_ORDER.filter((id) => id !== "waistband"),
    );
  });
});

describe("customisedSections", () => {
  it("marks only the section that differs from the start", () => {
    const spec = defaultSpec("dress");
    const sections = sectionsFor(specOptions(spec));
    expect(customisedSections(spec, sections)).toEqual([]);
    const next = setFeatureState(hydrateState("d", spec, null), "sleeve.type", "puff").spec!;
    expect(customisedSections(next, sections)).toEqual(["sleeve"]);
  });
});

describe("editor query", () => {
  const id = "00000000-0000-4000-8000-0000000000c1";
  it("keeps valid parameters and drops the rest", () => {
    expect(parseEditorQuery({ clientId: id, section: "sleeve" })).toEqual({
      clientId: id,
      section: "sleeve",
    });
    expect(parseEditorQuery({ clientId: "nope", section: "x" })).toEqual({});
    expect(parseEditorQuery({ clientId: [id] })).toEqual({ clientId: id });
    expect(isSectionId("closure")).toBe(true);
  });

  it("builds the editor link", () => {
    expect(editorHref("d1", {})).toBe("/designs/d1");
    expect(editorHref("d1", { clientId: id, section: "sleeve" })).toBe(
      `/designs/d1?clientId=${id}&section=sleeve`,
    );
  });
});
