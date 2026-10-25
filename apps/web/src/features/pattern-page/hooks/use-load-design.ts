"use client";
/** Hook that loads the design and its saved version into the editor and page stores, once per design. */
import { defaultSpec } from "@tafsila/engine/spec-rules";
import type { DesignDetail, PatternVersion } from "@tafsila/schemas";
import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDesign, useEditorStore } from "@/features/design-picker";
import { useMeasurementSet } from "@/features/measurements";
import { defaultPatternOptions, fromVersion, type PatternOptionsValue } from "@/features/pattern-options";
import type { BaseVersion } from "../model/save-state";
import { usePageStore } from "./use-page-store";

/**
 * The options a design opens with: the saved version's, or the defaults of a new pattern.
 *
 * @param version - The current version, if any.
 * @param clientId - The client, when known.
 * @returns The options and the base version.
 */
export function startingPoint(
  version: PatternVersion | null,
  clientId: string | null,
): { options: PatternOptionsValue; base: BaseVersion | null } {
  if (version === null) return { options: defaultPatternOptions(), base: null };
  return {
    options: fromVersion(version, clientId),
    base: { id: version.id, versionNo: version.versionNo, inputHash: version.inputHash },
  };
}

/**
 * Finds the client of a saved design: the URL's, else the owner of the version's measurement set.
 *
 * @param version - The current version, if any.
 * @param urlClientId - Client from the URL, if any.
 * @returns The client and whether the lookup has finished.
 */
function useSavedClient(
  version: PatternVersion | null,
  urlClientId: string | undefined,
): { settled: boolean; clientId: string | null } {
  const setId = version?.measurementSetId ?? undefined;
  const lookup = urlClientId === undefined ? setId : undefined;
  const savedSet = useMeasurementSet(lookup);
  return {
    settled: lookup === undefined || savedSet.isSuccess || savedSet.isError,
    clientId: urlClientId ?? savedSet.data?.clientId ?? null,
  };
}

/**
 * Loads a design and starts both stores. A saved design's client comes from its measurement set unless the URL names one.
 *
 * @param designId - Design id from the URL.
 * @param urlClientId - Client from the URL, if any.
 * @returns The design query and whether the stores hold this design.
 */
export function useLoadDesign(
  designId: string,
  urlClientId: string | undefined,
): { design: UseQueryResult<DesignDetail>; ready: boolean } {
  const design = useDesign(designId);
  const hydrate = useEditorStore((s) => s.hydrate);
  const load = usePageStore((s) => s.load);
  const storedFor = usePageStore((s) => s.designId);
  const version = design.data?.currentVersion ?? null;
  const category = design.data?.design.category;
  const { settled, clientId } = useSavedClient(version, urlClientId);
  useEffect(() => {
    if (category === undefined || !settled) return;
    hydrate(designId, version?.spec ?? defaultSpec(category));
    const start = startingPoint(version, clientId);
    load(designId, start.options, start.base);
  }, [category, settled, version, clientId, designId, hydrate, load]);
  return { design, ready: storedFor === designId && settled };
}
