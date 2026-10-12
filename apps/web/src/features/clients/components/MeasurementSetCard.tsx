/** A measurement set of a client: the newest one is expanded with six key values, older ones are link rows. */
import { Badge, ChevronEndIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { MeasurementSetView } from "../model/client-view";
import type { KeyValue } from "../model/measurement-summary";

/** Props for {@link MeasurementSetCard}. */
interface MeasurementSetCardProps {
  /** Client the set belongs to (for the link). */
  readonly clientId: string;
  /** The set. */
  readonly set: MeasurementSetView;
  /** Key values; present only for the expanded (newest) card. */
  readonly values?: readonly KeyValue[];
}

/**
 * Renders one set. With `values` it is the expanded "latest" card, otherwise a compact link row.
 *
 * @param props - Client id, set view and optional values.
 * @returns A list item.
 */
export function MeasurementSetCard({
  clientId,
  set,
  values,
}: Readonly<MeasurementSetCardProps>): ReactElement {
  const t = useTranslations("clients.sets");
  const m = useTranslations("measurements");
  const description = set.sizeLabel === null ? t("custom") : t("basedOn", { size: set.sizeLabel });
  const href = `/clients/${clientId}/measurements/${set.id}`;
  if (!values) {
    return (
      <li>
        <Link
          href={href}
          className="flex min-h-16 items-center gap-3 rounded-lg bg-surface p-4 shadow-card hover:bg-surface-hover"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="text-base font-semibold text-text">{set.label}</strong>
            <span className="text-sm text-muted">
              {description} · {set.when}
            </span>
          </span>
          <ChevronEndIcon className="size-5 shrink-0 text-muted" />
        </Link>
      </li>
    );
  }
  return (
    <li className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-text">
            {set.label} <Badge tone="info">{t("latest")}</Badge>
          </p>
          <p className="text-sm text-muted">
            {description} · {set.when}
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-base font-semibold text-text hover:bg-surface-hover"
        >
          {t("view")}
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {values.map((value) => (
          <div key={value.field} className="rounded-md bg-background p-3">
            <dt className="text-sm text-muted">{m(`fields.${value.field}`)}</dt>
            <dd className="text-lg font-semibold text-text">{m("cm", { value: value.cm })}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
