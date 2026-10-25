"use client";
/** A length field in centimetres for an optional override; an empty box removes the override (issue #246). */
import { FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import type { OverrideLimit, OverridePath } from "@tafsila/engine/spec-rules";
import { mmToCmText, parseOverride } from "@/shared/format";

/** Props for {@link FieldNumber}. */
interface FieldNumberProps {
  /** The override. */
  readonly path: OverridePath;
  /** Its limits in mm, from the engine. */
  readonly limit: OverrideLimit;
  /** The value in the design, in mm. */
  readonly valueMm: number | undefined;
  /** Called with the new value in mm, or undefined to remove it; never called with an out-of-range value. */
  readonly onChange: (mm: number | undefined) => void;
}

/** The message of each problem. */
const PROBLEM_KEY = { range: "error", invalid: "invalid" } as const;

/**
 * Shows one override: centimetres in the box, millimetres to the design, an inline error outside the limits.
 *
 * @param props - The override, its limits, the current value and the change handler.
 * @returns The field.
 */
export function FieldNumber({ path, limit, valueMm, onChange }: Readonly<FieldNumberProps>): ReactElement {
  const t = useTranslations("designPicker.overrides");
  const [text, setText] = useState(valueMm === undefined ? "" : mmToCmText(valueMm));
  const [problem, setProblem] = useState<"invalid" | "range" | null>(null);
  const range = { min: mmToCmText(limit.minMm), max: mmToCmText(limit.maxMm) };
  const key = path.replaceAll(".", "_");
  /**
   * Handles typing: keeps the text, shows a problem, and writes only a valid value.
   *
   * @param next - The new text of the box.
   */
  const edit = (next: string): void => {
    setText(next);
    const parsed = parseOverride(next, limit);
    setProblem(parsed.kind === "invalid" || parsed.kind === "range" ? parsed.kind : null);
    if (parsed.kind === "clear") onChange(undefined);
    if (parsed.kind === "set") onChange(parsed.mm);
  };
  return (
    <FormField
      label={t(key as never)}
      hint={t("range", range)}
      error={problem === null ? undefined : t(PROBLEM_KEY[problem], range)}
    >
      {(control) => (
        <div className="relative">
          <Input
            {...control}
            inputMode="decimal"
            dir="ltr"
            value={text}
            placeholder={t("default")}
            onChange={(event) => edit(event.target.value)}
            className="pe-14 text-end"
          />
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-base text-muted">
            {t("unit")}
          </span>
        </div>
      )}
    </FormField>
  );
}
