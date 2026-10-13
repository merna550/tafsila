/** The edit measurement set route: composes the measurements feature with the ids from the URL. */
import type { ReactElement } from "react";
import { EditMeasurementSetScreen } from "@/features/measurements";

/**
 * Renders the form for an existing measurement set.
 *
 * @param props - Route params.
 * @param props.params - Holds the client id and the set id.
 * @returns The page.
 */
export default async function EditMeasurementSetPage({
  params,
}: Readonly<{ params: Promise<{ id: string; setId: string }> }>): Promise<ReactElement> {
  const { id, setId } = await params;
  return <EditMeasurementSetScreen clientId={id} setId={setId} />;
}
