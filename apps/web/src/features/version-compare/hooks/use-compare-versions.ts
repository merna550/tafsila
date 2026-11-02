"use client";
/** Hook behind the compare screen: reads two versions and drafts both stored inputs in the preview worker (issue #345, no new API). */
import type { PatternVersionDetail } from "@tafsila/schemas";
import { useMemo } from "react";
import { useVersion, versionPreviewInput } from "@/features/pattern-versions";
import { usePatternPreview, type PreviewState } from "@/shared/pattern-preview";
import { diffVersions, type VersionDifference } from "../model/diff-versions";
import { matchPieces, type MatchedPiece } from "../model/match-pieces";

/** What the compare screen shows. */
export interface CompareVersions {
  /** The first version's query, for loading and error. */
  readonly queryA: ReturnType<typeof useVersion>;
  /** The second version's query. */
  readonly queryB: ReturnType<typeof useVersion>;
  /** The first version, once loaded. */
  readonly a: PatternVersionDetail | undefined;
  /** The second version, once loaded. */
  readonly b: PatternVersionDetail | undefined;
  /** True when both ids name the same version. */
  readonly same: boolean;
  /** True while a draft still runs or a version still loads. */
  readonly building: boolean;
  /** The first draft failed or the second did. */
  readonly failed: boolean;
  /** True when the two versions were saved by different engine versions. */
  readonly engineDiffers: boolean;
  /** What differs between the stored inputs. */
  readonly differences: readonly VersionDifference[];
  /** The pieces of both drafts, matched by id; empty until both drafts are done. */
  readonly pieces: readonly MatchedPiece[];
}

/**
 * Loads two versions and drafts them.
 *
 * @param idA - First version id.
 * @param idB - Second version id.
 * @returns Everything the screen shows.
 */
export function useCompareVersions(idA: string, idB: string): CompareVersions {
  const queryA = useVersion(idA);
  const queryB = useVersion(idB);
  const a = queryA.data;
  const b = queryB.data;
  const same = idA === idB;
  const inputA = useMemo(() => (a && !same ? versionPreviewInput(a.version) : null), [a, same]);
  const inputB = useMemo(() => (b && !same ? versionPreviewInput(b.version) : null), [b, same]);
  const previewA: PreviewState = usePatternPreview(inputA);
  const previewB: PreviewState = usePatternPreview(inputB);
  const ready = previewA.scene !== undefined && previewB.scene !== undefined;
  const pieces = useMemo(
    () => (previewA.scene && previewB.scene ? matchPieces(previewA.scene, previewB.scene) : []),
    [previewA.scene, previewB.scene],
  );
  const differences = useMemo(() => (a && b ? diffVersions(a.version, b.version) : []), [a, b]);
  return {
    queryA,
    queryB,
    a,
    b,
    same,
    building: !same && !ready && previewA.status !== "error" && previewB.status !== "error",
    failed: previewA.status === "error" || previewB.status === "error",
    engineDiffers: a !== undefined && b !== undefined && a.version.engineVersion !== b.version.engineVersion,
    differences,
    pieces,
  };
}
