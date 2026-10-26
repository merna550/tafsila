"use client";
/** The curve point spacing select (FR-CUT-02): 20, 25 or 30 mm. */
import { Select } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { CURVE_STEPS_MM, type CurveStepMm } from "../model/settings";

/** Props of {@link CurveStepSelect}. */
interface CurveStepSelectProps {
  /** The chosen gap, mm. */
  readonly value: CurveStepMm;
  /** Called with the new gap. */
  readonly onChange: (value: CurveStepMm) => void;
}

/**
 * Renders the labelled select.
 *
 * @param props - The value and the handler.
 * @returns The field.
 */
export function CurveStepSelect({ value, onChange }: Readonly<CurveStepSelectProps>): ReactElement {
  const t = useTranslations("directCut");
  const locale = useLocale() as AppLocale;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="curve-step" className="text-sm font-semibold">
        {t("curveStep")}
      </label>
      <Select
        id="curve-step"
        dir={DIRECTION[locale]}
        value={String(value)}
        options={CURVE_STEPS_MM.map((n) => ({ value: String(n), label: t("curveStepOption", { n }) }))}
        onValueChange={(next) => onChange(Number(next) as CurveStepMm)}
      />
    </div>
  );
}
