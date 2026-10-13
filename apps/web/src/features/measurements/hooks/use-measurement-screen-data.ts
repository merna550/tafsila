"use client";
/** Hook that loads everything the measurement screen needs: the client, the default chart and (when editing) the set. */
import type { Client, MeasurementSet, SizeChartResponse } from "@tafsila/schemas";
import { useClient } from "@/features/clients";
import { ApiError } from "@/shared/api";
import { useDefaultSizeChart } from "./use-default-size-chart";
import { useMeasurementSet } from "./use-measurement-set";

/** What the screen gets. */
export interface MeasurementScreenData {
  /** The client (for the name in the title). */
  readonly client?: Client;
  /** The default size chart. */
  readonly chart?: SizeChartResponse;
  /** The set being edited (edit screen only). */
  readonly set?: MeasurementSet;
  /** True while anything is loading. */
  readonly isPending: boolean;
  /** The first load error. */
  readonly error: unknown;
  /** True when the client or the set does not exist for this user (show the not-found page). */
  readonly missing: boolean;
  /** Reloads what failed. */
  readonly retry: () => void;
}

/**
 * Tells whether an error means "no such thing for this user".
 *
 * @param error - A load error.
 * @returns True for 404 and for an id that is not valid.
 */
function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.kind === "not-found" || error.kind === "validation");
}

/**
 * Loads the client, the chart and the set being edited.
 *
 * @param clientId - Client id from the URL.
 * @param setId - Set id from the URL (edit screen), if any.
 * @returns The data, loading and error state.
 */
export function useMeasurementScreenData(clientId: string, setId?: string): MeasurementScreenData {
  const client = useClient(clientId);
  const chart = useDefaultSizeChart();
  const set = useMeasurementSet(setId);
  const wantsSet = setId !== undefined;
  const queries = wantsSet ? [client, chart, set] : [client, chart];
  const error = queries.map((query) => query.error).find(Boolean) ?? null;
  const belongsElsewhere = wantsSet && set.data !== undefined && set.data.clientId !== clientId;
  return {
    client: client.data,
    chart: chart.data,
    set: wantsSet ? set.data : undefined,
    isPending: queries.some((query) => query.isPending),
    error,
    missing: belongsElsewhere || isMissing(client.error) || (wantsSet && isMissing(set.error)),
    retry: () => queries.forEach((query) => void query.refetch()),
  };
}
