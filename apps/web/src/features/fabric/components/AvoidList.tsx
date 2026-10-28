/** The "better avoided" list: each fabric with the reason it does not suit the design. */
import type { AvoidedFabric } from "@tafsila/schemas";
import { Card } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { fabricName, pickLocalized, type TextLocale } from "../model/localized";

/** Props of {@link AvoidList}. */
interface AvoidListProps {
  /** Fabrics to avoid, each with its reason. */
  readonly items: readonly AvoidedFabric[];
}

/**
 * Renders the avoid list, or nothing when it is empty.
 *
 * @param props - The avoided fabrics.
 * @returns The card, or null.
 */
export function AvoidList({ items }: Readonly<AvoidListProps>): ReactElement | null {
  const t = useTranslations("fabric.recommend");
  const locale = useLocale() as TextLocale;
  if (items.length === 0) return null;
  return (
    <Card title={t("avoidTitle")} aria-label={t("avoidTitle")}>
      <ul className="flex flex-col divide-y divide-line">
        {items.map((item) => (
          <li key={`${item.fabricId}-${item.ruleId}`} className="flex items-start gap-2.5 py-3">
            <span aria-hidden="true" className="text-danger">
              ✕
            </span>
            <p>
              <b>{fabricName(item.fabric, locale)}</b> · {pickLocalized(item.reason, locale)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
