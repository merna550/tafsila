/** Card of one recommended fabric: names, the best-fit mark, the one-line reason and the property meters. */
import type { RecommendedFabric } from "@tafsila/schemas";
import { Badge, Card } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { fabricAltName, fabricName, pickLocalized, type TextLocale } from "../model/localized";
import { propertyRows } from "../model/property-labels";
import { PropertyMeter } from "./PropertyMeter";

/** Props of {@link FabricCard}. */
interface FabricCardProps {
  /** The recommended fabric. */
  readonly item: RecommendedFabric;
  /** True for the top-ranked fabric, which gets the "best fit" mark. */
  readonly best: boolean;
}

/**
 * Renders one recommended fabric.
 *
 * @param props - The fabric and whether it ranks first.
 * @returns The card.
 */
export function FabricCard({ item, best }: Readonly<FabricCardProps>): ReactElement {
  const t = useTranslations("fabric.recommend");
  const locale = useLocale() as TextLocale;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold">{fabricName(item.fabric, locale)}</p>
          <p lang={locale === "ar" ? "en" : "ar"} className="text-sm text-muted">
            {fabricAltName(item.fabric, locale)}
          </p>
        </div>
        {best ? <Badge tone="success">{t("best")}</Badge> : null}
      </div>
      <p>{pickLocalized(item.reason, locale)}</p>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-1.5">
        {propertyRows(item.fabric.properties).map((row) => (
          <PropertyMeter key={row.name} row={row} />
        ))}
      </ul>
    </Card>
  );
}
