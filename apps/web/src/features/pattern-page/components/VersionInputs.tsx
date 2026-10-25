"use client";
/** The "inputs of version N" card of the read-only view: client, measurements, ease and fabric width. */
import type { PatternVersion } from "@tafsila/schemas";
import { Card } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useClient } from "@/features/clients";
import { useMeasurementSet } from "@/features/measurements";
import { mmToCmText } from "@/shared/format";

/**
 * Renders what the version was made from; the client and set names come from the live records when they still exist.
 *
 * @param props - Component props.
 * @param props.version - The stored version.
 * @returns The card.
 */
export function VersionInputs({ version }: Readonly<{ version: PatternVersion }>): ReactElement {
  const t = useTranslations("versionHistory.inputs");
  const ease = useTranslations("patternOptions.ease.profiles");
  const set = useMeasurementSet(version.measurementSetId ?? undefined);
  const client = useClient(set.data?.clientId ?? null);
  const fabric = version.options["fabricWidthMm"];
  return (
    <Card className="flex flex-col gap-2 p-4 lg:w-80 lg:flex-none" data-testid="version-inputs">
      <h2 className="text-lg font-semibold text-text">{t("title", { n: version.versionNo })}</h2>
      <dl className="flex flex-col gap-1 text-base text-muted">
        {client.data ? <Line label={t("client")} value={client.data.name} /> : null}
        <Line label={t("set")} value={set.data?.label ?? version.sizeLabel ?? t("deletedSet")} />
        <Line label={t("ease")} value={ease(version.easeProfile)} />
        {typeof fabric === "number" ? (
          <Line label={t("fabric")} value={t("cm", { value: mmToCmText(fabric) })} />
        ) : null}
      </dl>
    </Card>
  );
}

/**
 * One label and value line.
 *
 * @param props - Component props.
 * @param props.label - The label.
 * @param props.value - The value.
 * @returns The line.
 */
function Line({ label, value }: Readonly<{ label: string; value: string }>): ReactElement {
  return (
    <div className="flex gap-1">
      <dt>{label}:</dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}
