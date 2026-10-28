/** One property of a fabric as a label and a five-step meter, with the level word for screen readers. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { METER_STEPS, type PropertyRow } from "../model/property-labels";

/** Props of {@link PropertyMeter}. */
interface PropertyMeterProps {
  /** The property and its level. */
  readonly row: PropertyRow;
}

/**
 * Renders the property name and the filled steps.
 *
 * @param props - The property row.
 * @returns The meter.
 */
export function PropertyMeter({ row }: Readonly<PropertyMeterProps>): ReactElement {
  const t = useTranslations("fabric.recommend");
  return (
    <li className="flex items-center justify-between gap-2 text-sm text-muted">
      <span>{t(`properties.${row.name}`)}</span>
      <span aria-hidden="true" className="inline-flex gap-1">
        {Array.from({ length: METER_STEPS }, (_, step) => (
          <span
            key={step}
            className={`size-2.5 rounded-full ${step < row.filled ? "bg-primary" : "bg-line"}`}
          />
        ))}
      </span>
      <span className="sr-only">{t(`levels.${row.levelKey}`)}</span>
    </li>
  );
}
