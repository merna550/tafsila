"use client";
/** Hooks that load the client and the measurement set a pattern's options point at (issue #247). */
import type { Client, MeasurementSet } from "@tafsila/schemas";
import { useClient, useClientMeasurementSets, useClients } from "@/features/clients";
import type { PatternOptionsValue } from "../model/pattern-options";

/** The client and set the options point at. */
export interface SelectedOptionSources {
  /** The chosen client, once loaded. */
  readonly client: Client | undefined;
  /** The chosen measurement set, once loaded. */
  readonly set: MeasurementSet | undefined;
  /** True while either is loading. */
  readonly isLoading: boolean;
}

/**
 * Finds the chosen client and set for the pattern page, which builds the preview input from them.
 * Both come from the lists already cached by the panel, so no extra request is made for the set.
 *
 * @param value - The panel value.
 * @returns The client, the set and a loading flag.
 */
export function useSelectedOptionSources(value: PatternOptionsValue): SelectedOptionSources {
  const client = useClient(value.clientId);
  const sets = useClientMeasurementSets(value.clientId);
  const set = sets.data?.items.find((item) => item.id === value.measurementSetId);
  return {
    client: client.data,
    set,
    isLoading: value.clientId !== null && (client.isPending || sets.isPending),
  };
}

/** Shared empty list, so an unloaded list keeps one identity between renders. */
const NO_SETS: readonly MeasurementSet[] = [];

/** What the panel's pickers need. */
export interface PickerSources {
  /** Clients for the dropdown (first page), with the chosen one added when it is not on it. */
  readonly clients: readonly Client[];
  /** The chosen client's sets, newest first. */
  readonly sets: readonly MeasurementSet[];
  /** True while the client's sets load. */
  readonly setsLoading: boolean;
  /** True when the client list failed to load. */
  readonly clientsFailed: boolean;
}

/**
 * Loads what the client and set dropdowns show.
 *
 * @param clientId - The chosen client, or null.
 * @returns Clients, the chosen client's sets and load flags.
 */
export function usePickerSources(clientId: string | null): PickerSources {
  const list = useClients("");
  const chosen = useClient(clientId);
  const sets = useClientMeasurementSets(clientId);
  const extra = chosen.data && !list.clients.some((c) => c.id === chosen.data.id) ? [chosen.data] : [];
  return {
    clients: [...extra, ...list.clients],
    sets: sets.data?.items ?? NO_SETS,
    setsLoading: clientId !== null && sets.isPending,
    clientsFailed: list.error !== null && list.error !== undefined,
  };
}
