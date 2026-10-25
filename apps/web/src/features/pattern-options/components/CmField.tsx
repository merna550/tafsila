"use client";
/** A required length field in centimetres: millimetres go to the options, an error shows outside the limits (issue #247). */
import { FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { mmToCmText, parseOverride } from "@/shared/format";

/** Props for {@link CmField}. */
export interface CmFieldProps {
  /** Visible label (already translated). */
  readonly label: string;
  /** The value in mm. */
  readonly valueMm: number;
  /** Shortest and longest value in mm. */
  readonly limit: { readonly minMm: number; readonly maxMm: number };
  /** The default in mm, shown in the hint and restored by "reset". */
  readonly defaultMm: number;
  /** Called with a valid value in mm; never with an out-of-range or empty one. */
  readonly onChange: (mm: number) => void;
}

/** The message of each problem. */
const PROBLEM_KEY = { range: "error", invalid: "invalid" } as const;

/**
 * Maps what typing meant to the problem to show.
 *
 * @param kind - The parse result kind.
 * @returns The problem, or null for a valid value.
 */
function problemOf(kind: "clear" | "set" | "invalid" | "range"): "invalid" | "range" | null {
  if (kind === "set") return null;
  return kind === "range" ? "range" : "invalid";
}

/**
 * Shows one length: text in cm, an inline error for text outside the limits, and a reset to the default.
 *
 * @param props - Label, value, limits, default and change handler.
 * @returns The field.
 */
export function CmField({
  label,
  valueMm,
  limit,
  defaultMm,
  onChange,
}: Readonly<CmFieldProps>): ReactElement {
  const t = useTranslations("patternOptions.field");
  const [text, setText] = useState(mmToCmText(valueMm));
  const [problem, setProblem] = useState<"invalid" | "range" | null>(null);
  const range = {
    min: mmToCmText(limit.minMm),
    max: mmToCmText(limit.maxMm),
    default: mmToCmText(defaultMm),
  };
  /**
   * Handles typing: keeps the text, shows a problem, and reports only a valid value.
   *
   * @param next - The new text of the box.
   */
  const edit = (next: string): void => {
    setText(next);
    const parsed = parseOverride(next, limit);
    setProblem(problemOf(parsed.kind));
    if (parsed.kind === "set") onChange(parsed.mm);
  };
  return (
    <FormField
      label={label}
      hint={t("range", range)}
      error={problem === null ? undefined : t(PROBLEM_KEY[problem], range)}
    >
      {(control) => (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              {...control}
              inputMode="decimal"
              dir="ltr"
              value={text}
              onChange={(event) => edit(event.target.value)}
              className="pe-14 text-end"
            />
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-base text-muted">
              {t("unit")}
            </span>
          </div>
          <button
            type="button"
            className="min-h-11 shrink-0 rounded-md px-2 text-sm font-semibold text-primary underline disabled:text-muted disabled:no-underline"
            disabled={text === range.default && problem === null}
            aria-label={t("resetNamed", { name: label })}
            onClick={() => edit(range.default)}
          >
            {t("reset")}
          </button>
        </div>
      )}
    </FormField>
  );
}
