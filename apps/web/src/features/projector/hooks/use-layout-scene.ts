"use client";
/** Loads a saved version and its saved fabric calculation, asks the nesting worker for the marker of one fabric kind and returns it as a projector scene (issue #321). */
import type { PatternVersionDetail } from "@tafsila/schemas";
import { useEffect, useMemo, useRef } from "react";
import { useSavedFabricCalc } from "@/features/fabric";
import { useVersion, versionPreviewInput } from "@/features/pattern-versions";
import type { ApiError } from "@/shared/api";
import {
  useFabricNesting,
  type FabricKind,
  type FabricState,
  type FabricWorkerFactory,
} from "@/shared/fabric-nesting";
import { markerToScene, type ProjectorSceneData } from "../model/projector-mode";

/** What {@link useLayoutScene} returns: the shape of `useProjectorScene` plus what layout mode needs. */
export interface LayoutSource {
  /** The saved version, once loaded. */
  readonly version: PatternVersionDetail["version"] | undefined;
  /** The marker as a scene, once calculated. */
  readonly scene: ProjectorSceneData | undefined;
  /** Why loading or calculating failed, if it did. */
  readonly failure: ApiError | null;
  /** True until the scene is ready, something failed or there is nothing to project. */
  readonly loading: boolean;
  /** True when no calculation is saved for the version, or it has no layout of this kind. */
  readonly needsCalc: boolean;
  /** Metres to buy of this kind, once calculated. */
  readonly lengthM: number | null;
}

/**
 * Why loading or calculating failed.
 *
 * @param state - The worker state.
 * @param versionError - Error of the version query.
 * @param savedError - Error of the saved calculation query.
 * @returns The first error, or null.
 */
function failureOf(
  state: FabricState,
  versionError: Error | null,
  savedError: Error | null,
): ApiError | null {
  if (state.status === "error") return state.error;
  return (versionError ?? savedError) as ApiError | null;
}

/**
 * Tells whether there is nothing to project: no saved calculation, or a finished one without this fabric kind.
 *
 * @param state - The worker state.
 * @param saved - The saved calculation query.
 * @param saved.isPending - True while it loads.
 * @param saved.error - Its error, if any.
 * @param saved.data - The calculation, or null when none is saved.
 * @param line - The line of the wanted kind, if the worker finished.
 * @returns True when the "calculate first" message applies.
 */
function nothingToProject(
  state: FabricState,
  saved: { isPending: boolean; error: Error | null; data: unknown },
  line: unknown,
): boolean {
  const noneSaved = !saved.isPending && !saved.error && saved.data === null;
  return noneSaved || (state.status === "done" && !line);
}

/**
 * Rebuilds the marker of one fabric kind with the options of the saved calculation; nothing new is stored (ADR-318).
 *
 * @param versionId - Version id from the URL.
 * @param kind - The fabric kind to project.
 * @param createWorker - Worker factory; tests pass a fake.
 * @returns The scene and its loading state.
 */
export function useLayoutScene(
  versionId: string,
  kind: FabricKind,
  createWorker?: FabricWorkerFactory,
): LayoutSource {
  const query = useVersion(versionId);
  const saved = useSavedFabricCalc(versionId);
  const { state, run } = useFabricNesting(createWorker);
  const version = query.data?.version;
  const options = saved.data?.options;
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !version || !options) return;
    started.current = true;
    run({ input: versionPreviewInput(version), options });
  }, [version, options, run]);

  const line = state.status === "done" ? state.answer.kinds.find((k) => k.kind === kind) : undefined;
  const scene = useMemo(() => (line ? markerToScene(line.scene) : undefined), [line]);
  const failure = failureOf(state, query.error, saved.error);
  const needsCalc = nothingToProject(state, saved, line);
  return {
    version,
    scene,
    failure,
    loading: failure === null && !needsCalc && scene === undefined,
    needsCalc,
    lengthM: line?.lengthM ?? null,
  };
}
