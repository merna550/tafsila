/** The "Measurements" section of the profile: count, "new measurements" link, the newest set expanded, older ones as rows. */
import { EmptyState } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import type { MeasurementSetView } from "../model/client-view";
import type { KeyValue } from "../model/measurement-summary";
import { MeasurementSetCard } from "./MeasurementSetCard";

/** Props for {@link MeasurementSetsSection}. */
interface MeasurementSetsSectionProps {
  /** Client id. */
  readonly clientId: string;
  /** Sets, newest first. */
  readonly sets: readonly MeasurementSetView[];
  /** Key values of the newest set. */
  readonly latestValues: readonly KeyValue[];
}

/**
 * Renders the sets of a client, or an empty state when she has none.
 *
 * @param props - Client id, sets and the newest set's values.
 * @returns The section.
 */
export function MeasurementSetsSection({
  clientId,
  sets,
  latestValues,
}: Readonly<MeasurementSetsSectionProps>): ReactElement {
  const t = useTranslations("clients.sets");
  const [latest, ...older] = sets;
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-text">
          {t("title")} <span className="text-sm font-normal text-muted">({sets.length})</span>
        </h2>
        <Link
          href={`/clients/${clientId}/measurements/new`}
          className="inline-flex min-h-12 items-center rounded-md bg-primary px-5 text-lg font-semibold text-on-primary hover:bg-primary-hover"
        >
          {t("new")}
        </Link>
      </div>
      {latest ? (
        <ul className="flex flex-col gap-4">
          <MeasurementSetCard clientId={clientId} set={latest} values={latestValues} />
          {older.map((set) => (
            <MeasurementSetCard key={set.id} clientId={clientId} set={set} />
          ))}
        </ul>
      ) : (
        <EmptyState title={t("empty.title")} description={t("empty.description")} />
      )}
    </section>
  );
}
