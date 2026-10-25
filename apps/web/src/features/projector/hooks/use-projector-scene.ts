"use client";
/** Loads a saved version and drafts its pattern scene in the preview worker; the projector draws that scene (issue #286). */
import type { PatternVersionDetail } from "@tafsila/schemas";
import type { PatternScene } from "@tafsila/engine/viewer";
import { useMemo } from "react";
import { useVersion, versionPreviewInput } from "@/features/pattern-versions";
import type { ApiError } from "@/shared/api";
import { previewErrorToApiError, usePatternPreview } from "@/shared/pattern-preview";

/** What {@link useProjectorScene} returns. */
export interface ProjectorScene {
  /** The saved version, once loaded. */
  readonly version: PatternVersionDetail["version"] | undefined;
  /** The scene, once drafted. */
  readonly scene: PatternScene | undefined;
  /** Why the version or the draft failed, if it did. */
  readonly failure: ApiError | null;
  /** True until the scene is ready or something failed. */
  readonly loading: boolean;
}

/**
 * Reads the version and drafts its stored inputs.
 *
 * @param versionId - Version id from the URL.
 * @returns The version, the scene, a failure and the loading flag.
 */
export function useProjectorScene(versionId: string): ProjectorScene {
  const query = useVersion(versionId);
  const version = query.data?.version;
  const input = useMemo(() => (version ? versionPreviewInput(version) : null), [version]);
  const preview = usePatternPreview(input);
  const draftFailure =
    preview.status === "error" && preview.error ? previewErrorToApiError(preview.error) : null;
  const failure = draftFailure ?? (query.error as ApiError | null);
  return { version, scene: preview.scene, failure, loading: failure === null && preview.scene === undefined };
}
