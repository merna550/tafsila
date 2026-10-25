/** The panel of the open section: its feature cards and, below, its optional length fields (issue #246). */
import type { FeaturePath, OverridePath, SpecOptions } from "@tafsila/engine/spec-rules";
import { OVERRIDE_LIMITS_MM } from "@tafsila/engine/spec-rules";
import type { DesignSpec } from "@tafsila/schemas";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { FIELDS_BY_SECTION } from "../model/section-fields";
import type { SectionId } from "../model/sections";
import { overrideApplies, readOverride } from "../model/override-spec";
import { readFeature } from "../model/spec-path";
import { FieldChoice } from "./FieldChoice";
import { FieldMulti } from "./FieldMulti";
import { FieldNumber } from "./FieldNumber";

/** Props for {@link SectionPanel}. */
interface SectionPanelProps {
  /** Section title (already translated). */
  readonly title: string;
  /** The open section. */
  readonly section: SectionId;
  /** The design being edited. */
  readonly spec: DesignSpec;
  /** What the engine offers for the design. */
  readonly options: SpecOptions;
  /** Sets a feature; pockets get the full list. */
  readonly onChange: (path: FeaturePath, value: string | boolean | string[]) => void;
  /** Sets or removes a length override in mm. */
  readonly onOverride: (path: OverridePath, mm: number | undefined) => void;
}

/**
 * Reads the current value of a choice as the text its card carries.
 *
 * @param spec - The design.
 * @param path - The feature.
 * @returns The value as text; a missing slit reads as "none".
 */
function currentChoice(spec: DesignSpec, path: FeaturePath): string | undefined {
  if (path === "skirt.slit") return spec.skirt?.slit?.position ?? "none";
  const value = readFeature(spec, path);
  return typeof value === "string" || typeof value === "boolean" ? String(value) : undefined;
}

/**
 * Turns the text of a chosen card back into the value the design holds.
 *
 * @param text - The card value.
 * @returns A boolean for "true" and "false", else the text.
 */
function fromCard(text: string): string | boolean {
  if (text === "true") return true;
  return text === "false" ? false : text;
}

/** Props for {@link ChoiceFields}. */
type ChoiceFieldsProps = Omit<SectionPanelProps, "title" | "onOverride">;

/**
 * Renders the choice and multi-choice fields of a section that apply to the design.
 *
 * @param props - The section, design, options and change handler.
 * @returns The fields.
 */
function ChoiceFields({ section, spec, options, onChange }: Readonly<ChoiceFieldsProps>): ReactElement {
  return (
    <>
      {FIELDS_BY_SECTION[section].map((field) => {
        if (field.kind === "number" || !options[field.path].applies) return null;
        if (field.kind === "multi") {
          return (
            <FieldMulti
              key={field.path}
              path={field.path}
              options={options[field.path]}
              value={spec.pockets}
              onChange={(value) => onChange(field.path, value)}
            />
          );
        }
        return (
          <FieldChoice
            key={field.path}
            path={field.path}
            options={options[field.path]}
            value={currentChoice(spec, field.path)}
            onChoose={(value) => onChange(field.path, fromCard(value))}
          />
        );
      })}
    </>
  );
}

/** Props for {@link OverridesCard}. */
interface OverridesCardProps {
  /** The design. */
  readonly spec: DesignSpec;
  /** The overrides to show. */
  readonly paths: readonly OverridePath[];
  /** Sets or removes a length override in mm. */
  readonly onOverride: (path: OverridePath, mm: number | undefined) => void;
}

/**
 * Renders the card of optional length fields.
 *
 * @param props - The design, the overrides and the change handler.
 * @returns The card.
 */
function OverridesCard({ spec, paths, onOverride }: Readonly<OverridesCardProps>): ReactElement {
  const t = useTranslations("designPicker.overrides");
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold">
          {t("title")} <span className="text-base font-normal text-muted">{t("optional")}</span>
        </h3>
        <p className="text-sm text-muted">{t("hint")}</p>
      </div>
      {paths.map((path) => (
        <FieldNumber
          key={path}
          path={path}
          limit={OVERRIDE_LIMITS_MM[path]}
          valueMm={readOverride(spec, path)}
          onChange={(mm) => onOverride(path, mm)}
        />
      ))}
    </section>
  );
}

/**
 * Renders the open section: every field of the table that applies to this design.
 *
 * @param props - The section, design, options and change handlers.
 * @returns The panel and, when the section has length fields, the overrides card.
 */
export function SectionPanel({ title, onOverride, ...rest }: Readonly<SectionPanelProps>): ReactElement {
  const numbers = FIELDS_BY_SECTION[rest.section].flatMap((f) =>
    f.kind === "number" && overrideApplies(rest.spec, f.path) ? [f.path] : [],
  );
  return (
    <>
      <section className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <ChoiceFields {...rest} />
      </section>
      {numbers.length === 0 ? null : (
        <OverridesCard spec={rest.spec} paths={numbers} onOverride={onOverride} />
      )}
    </>
  );
}
