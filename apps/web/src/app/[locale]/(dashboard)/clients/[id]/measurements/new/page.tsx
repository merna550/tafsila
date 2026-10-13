/** The new measurement set route: composes the measurements feature with the client id from the URL. */
import type { ReactElement } from "react";
import { NewMeasurementSetScreen } from "@/features/measurements";

/**
 * Renders the form for a new measurement set.
 *
 * @param props - Route params.
 * @param props.params - Holds the client id.
 * @returns The page.
 */
export default async function NewMeasurementSetPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<ReactElement> {
  const { id } = await params;
  return <NewMeasurementSetScreen clientId={id} />;
}
