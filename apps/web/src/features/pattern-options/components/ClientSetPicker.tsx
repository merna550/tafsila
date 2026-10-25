"use client";
/** Client and measurement set dropdowns, the set's warnings and the empty state (FR-MEAS-01, FR-MEAS-03, issue #247). */
import type { Client, MeasurementSet } from "@tafsila/schemas";
import { FormField, Select } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { DIRECTION, Link, type AppLocale } from "@/shared/i18n";

/** Props for {@link ClientSetPicker}. */
export interface ClientSetPickerProps {
  /** Clients to choose from. */
  readonly clients: readonly Client[];
  /** The chosen client id, or null. */
  readonly clientId: string | null;
  /** The chosen client's sets, newest first. */
  readonly sets: readonly MeasurementSet[];
  /** The chosen set id, or null. */
  readonly setId: string | null;
  /** True while the sets load. */
  readonly setsLoading: boolean;
  /** Called with the chosen client id. */
  readonly onClient: (id: string) => void;
  /** Called with the chosen set id. */
  readonly onSet: (id: string) => void;
}

/**
 * Renders the two dropdowns; a client without sets gets a link to add the first one.
 *
 * @param props - Lists, current ids and change handlers.
 * @returns The group.
 */
export function ClientSetPicker(props: Readonly<ClientSetPickerProps>): ReactElement {
  const { clients, clientId, sets, setId, setsLoading, onClient, onSet } = props;
  const t = useTranslations("patternOptions.pick");
  const locale = useLocale() as AppLocale;
  const dir = DIRECTION[locale];
  const chosen = sets.find((set) => set.id === setId);
  const noSets = clientId !== null && !setsLoading && sets.length === 0;
  return (
    <>
      <FormField label={t("client")}>
        {(control) => (
          <Select
            {...control}
            dir={dir}
            value={clientId ?? undefined}
            placeholder={t("clientPlaceholder")}
            onValueChange={onClient}
            options={clients.map((client) => ({ value: client.id, label: client.name }))}
          />
        )}
      </FormField>
      <FormField label={t("set")} hint={sets.length > 1 ? t("newestFirst") : undefined}>
        {(control) => (
          <Select
            {...control}
            dir={dir}
            value={setId ?? undefined}
            disabled={clientId === null || sets.length === 0}
            placeholder={clientId === null ? t("clientFirst") : t("setPlaceholder")}
            onValueChange={onSet}
            options={sets.map((set, index) => ({
              value: set.id,
              label: index === 0 ? t("newest", { label: set.label }) : set.label,
            }))}
          />
        )}
      </FormField>
      {noSets ? (
        <p className="text-sm text-text">
          {t("noSets")}{" "}
          <Link href={`/clients/${clientId}/measurements/new`} className="font-semibold">
            {t("addSet")}
          </Link>
        </p>
      ) : null}
      {chosen?.warnings.length ? (
        <ul role="status" className="flex flex-col gap-1 rounded-md bg-surface-hover p-3 text-sm text-text">
          {chosen.warnings.map((warning) => (
            <li key={`${warning.code}-${warning.fields.join()}`}>
              {locale === "ar" ? warning.message_ar : warning.message_en}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
