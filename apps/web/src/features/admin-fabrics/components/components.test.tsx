import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { conditionFor, toggleValue } from "../model/condition-builder";
import { previewRule } from "../model/preview";
import { DEFAULT_PREVIEW_DESIGN } from "../model/preview-designs";
import { EMPTY_RULE_FORM, type RuleFormValues } from "../model/rule-form";
import { ConditionRow } from "./ConditionRow";
import { LevelPicker } from "./LevelPicker";
import { PreviewBox } from "./PreviewBox";
import { RuleConditions } from "./RuleConditions";
import { RuleEffectFields } from "./RuleEffectFields";
import { DRAFT_CATALOGUE, DRAFT_RULES } from "@tafsila/fabric-kb";
import type { FabricRule } from "@tafsila/schemas";

/** A rule that excludes most dresses, for the preview. */
const strict: FabricRule = {
  id: "preview-draft",
  when: [{ path: "category", op: "in", values: ["dress"] }],
  effect: { property: "weight", max: 0, strength: "must" },
  priority: 5,
  reason: { ar: "س", en: "r" },
};

/**
 * Renders the effect fields inside a component that owns the form.
 *
 * @returns The element.
 */
function EffectHarness(): React.ReactElement {
  const form = useForm<RuleFormValues>({ defaultValues: EMPTY_RULE_FORM });
  return <RuleEffectFields form={form} errorOf={() => undefined} dir="ltr" />;
}

describe("LevelPicker", () => {
  it("shows 1 to 5, marks the stored level plus one and offers a none choice", () => {
    const html = renderWithIntl(
      <LevelPicker label="Drape" value={3} onChange={() => undefined} noneLabel="No limit" hint="1 stiff" />,
      "en",
    );
    expect(html.match(/role="radio"/g)).toHaveLength(6);
    expect(html).toMatch(/aria-checked="true"[^>]*>4</);
    expect(html).toContain("No limit");
    expect(html).toContain("1 stiff");
  });

  it("marks the none choice when the value is null and shows an error", () => {
    const html = renderWithIntl(
      <LevelPicker label="Max" value={null} onChange={() => undefined} noneLabel="No limit" error="Wrong" />,
      "en",
    );
    expect(html).toMatch(/aria-checked="true"[^>]*>No limit</);
    expect(html).toContain('role="alert"');
  });
});

describe("ConditionRow", () => {
  it("offers only the values of the chosen path, as words", () => {
    const html = renderWithIntl(
      <ConditionRow
        index={0}
        draft={toggleValue(conditionFor("skirt.type"), "pleated")}
        onChange={() => undefined}
        dir="ltr"
      />,
      "en",
    );
    expect(html).toContain("Pleated");
    expect(html.match(/type="button" role="checkbox"/g)).toHaveLength(7);
    expect(html).not.toContain("Peter Pan");
  });

  it("offers no value boxes for a flag path", () => {
    const html = renderWithIntl(
      <ConditionRow index={0} draft={conditionFor("lining")} onChange={() => undefined} dir="ltr" />,
      "en",
    );
    expect(html).not.toContain('role="checkbox"');
  });
});

describe("PreviewBox", () => {
  it("shows the saved and the edited recommendations and says the edit changes them", () => {
    const preview = previewRule(DEFAULT_PREVIEW_DESIGN.spec, DRAFT_CATALOGUE, DRAFT_RULES, strict);
    const html = renderWithIntl(
      <PreviewBox
        designKey={DEFAULT_PREVIEW_DESIGN.key}
        onDesignChange={() => undefined}
        preview={preview}
        nameOf={(id) => id}
        dir="ltr"
      />,
      "en",
    );
    expect(html).toContain("Preview before saving");
    expect(html).toContain("This edit changes the recommendations.");
    expect(html).toContain('data-testid="preview-before"');
    expect(html).toContain('data-testid="preview-after"');
  });

  it("asks to complete the rule while there is no preview", () => {
    const html = renderWithIntl(
      <PreviewBox
        designKey={DEFAULT_PREVIEW_DESIGN.key}
        onDesignChange={() => undefined}
        preview={undefined}
        nameOf={(id) => id}
        dir="rtl"
      />,
      "ar",
    );
    expect(html).toContain("أكملي الشروط");
  });
});

describe("RuleConditions and RuleEffectFields", () => {
  it("lists each condition with a remove button only when there is more than one, and an add button", () => {
    const one = renderWithIntl(
      <RuleConditions conditions={[conditionFor("skirt.type")]} onChange={() => undefined} dir="ltr" />,
      "en",
    );
    expect(one).toContain("Add a condition");
    expect(one).not.toContain("Remove condition");
    const two = renderWithIntl(
      <RuleConditions
        conditions={[conditionFor("skirt.type"), conditionFor("lining")]}
        onChange={() => undefined}
        dir="ltr"
      />,
      "en",
    );
    expect(two).toContain("Remove condition 2");
  });

  it("shows the strength, the two bounds with a no-limit choice and the priority", () => {
    const html = renderWithIntl(<EffectHarness />, "en");
    expect(html).toContain("What the fabric needs");
    expect(html).toContain("At least");
    expect(html).toContain("At most");
    expect(html.match(/No limit/g)).toHaveLength(2);
    expect(html.match(/Priority 3/g)).toHaveLength(1);
  });
});
