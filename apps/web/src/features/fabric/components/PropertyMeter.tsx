/** One property of a fabric as a label and a five-step meter, with the level word for screen readers. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { PropertyRow } from "../model/property-labels";
import { LevelDots } from "./LevelDots";

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
      <LevelDots filled={row.filled} />
      <span className="sr-only">{t(`levels.${row.levelKey}`)}</span>
    </li>
  );
}
