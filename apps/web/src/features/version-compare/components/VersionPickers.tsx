"use client";
/** The two version selectors with the swap button above the overlay (issue #345). */
import { Button, Select, type SelectOption } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props of {@link VersionPickers}. */
interface VersionPickersProps {
  /** The versions that can be chosen. */
  readonly options: readonly SelectOption[];
  /** First version id. */
  readonly a: string;
  /** Second version id. */
  readonly b: string;
  /** Called with the new pair. */
  readonly onChange: (pair: { readonly a: string; readonly b: string }) => void;
  /** Page direction, for the menus. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the pickers.
 *
 * @param props - Options, the pair and the change handler.
 * @returns The row of controls.
 */
export function VersionPickers({
  options,
  a,
  b,
  onChange,
  dir,
}: Readonly<VersionPickersProps>): ReactElement {
  const t = useTranslations("compare");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <label htmlFor="compare-a" className="text-base font-semibold text-text">
          {t("first")}
        </label>
        <Select
          id="compare-a"
          options={options}
          value={a}
          onValueChange={(v) => onChange({ a: v, b })}
          dir={dir}
        />
      </div>
      <Button
        variant="secondary"
        onClick={() => onChange({ a: b, b: a })}
        aria-label={t("swap")}
        data-testid="swap-versions"
      >
        <span aria-hidden="true">⇄</span>
      </Button>
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <label htmlFor="compare-b" className="text-base font-semibold text-text">
          {t("second")}
        </label>
        <Select
          id="compare-b"
          options={options}
          value={b}
          onValueChange={(v) => onChange({ a, b: v })}
          dir={dir}
        />
      </div>
    </div>
  );
}
