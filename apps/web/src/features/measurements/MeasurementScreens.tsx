"use client";
/** The two measurement routes: new set and edit set. Both load the client, the chart and (edit) the set, then show the editor. */
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import { MeasurementEditor } from "./MeasurementEditor";
import { useMeasurementScreenData } from "./hooks/use-measurement-screen-data";

/** Props for {@link MeasurementScreen}. */
interface MeasurementScreenProps {
  /** Client id from the URL. */
  readonly clientId: string;
  /** Set id from the URL (edit route only). */
  readonly setId?: string;
}

/**
 * Loads what the form needs; a client or set that is not the user's shows the standard not-found page.
 *
 * @param props - Ids from the URL.
 * @returns The screen.
 */
function MeasurementScreen({ clientId, setId }: Readonly<MeasurementScreenProps>): ReactElement {
  const data = useMeasurementScreenData(clientId, setId);
  if (data.missing) notFound();
  const { client, chart, set } = data;
  const ready = client && chart && (setId === undefined || set);
  return (
    <DataState isPending={data.isPending} error={data.error} isEmpty={false} onRetry={data.retry}>
      {ready ? <MeasurementEditor key={set?.id ?? "new"} client={client} chart={chart} set={set} /> : null}
    </DataState>
  );
}

/**
 * The /clients/[id]/measurements/new screen.
 *
 * @param props - The client id.
 * @param props.clientId - Client id from the URL.
 * @returns The screen.
 */
export function NewMeasurementSetScreen({ clientId }: Readonly<{ clientId: string }>): ReactElement {
  return <MeasurementScreen clientId={clientId} />;
}

/**
 * The /clients/[id]/measurements/[setId] screen.
 *
 * @param props - The ids.
 * @param props.clientId - Client id from the URL.
 * @param props.setId - Set id from the URL.
 * @returns The screen.
 */
export function EditMeasurementSetScreen({
  clientId,
  setId,
}: Readonly<{ clientId: string; setId: string }>): ReactElement {
  return <MeasurementScreen clientId={clientId} setId={setId} />;
}
