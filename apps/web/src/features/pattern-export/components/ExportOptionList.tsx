"use client";
/** The radio rows of the export dialog: one row per file kind with its one-line hint (issue #289). */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { ExportKind } from "@/shared/pattern-export";
import { EXPORT_OPTIONS } from "../model/export-options";

/** Props of {@link ExportOptionList}. */
interface ExportOptionListProps {
  /** The chosen kind. */
  readonly value: ExportKind;
  /** Called when another row is chosen. */
  readonly onChange: (kind: ExportKind) => void;
  /** True while a build runs; the rows cannot change then. */
  readonly disabled: boolean;
}

/**
 * Renders the option rows as a labelled radio group.
 *
 * @param props - The chosen kind, the change handler and the disabled flag.
 * @returns The group.
 */
export function ExportOptionList({
  value,
  onChange,
  disabled,
}: Readonly<ExportOptionListProps>): ReactElement {
  const t = useTranslations("patternExport");
  return (
    <div role="radiogroup" aria-label={t("optionsLabel")} className="flex flex-col gap-2.5">
      {EXPORT_OPTIONS.map(({ kind, key }) => {
        const selected = kind === value;
        return (
          <label
            key={kind}
            className={`flex min-h-11 items-start gap-3 rounded-md px-3.5 py-3 ${
              selected ? "border-2 border-primary bg-primary-soft" : "border border-border bg-surface"
            }`}
          >
            <input
              type="radio"
              name="export-kind"
              value={kind}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(kind)}
              className="mt-1 size-5 accent-primary"
              data-testid={`export-option-${kind}`}
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-lg font-semibold text-text">{t(`option.${key}.label`)}</span>
              <span className="text-base text-muted">{t(`option.${key}.hint`)}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
