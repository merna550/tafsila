"use client";
/** Hook behind the old-version screen: reads the version, draws its stored inputs in the worker and tells if it is the current one. */
import type { PatternVersionDetail } from "@tafsila/schemas";
import { useMemo } from "react";
import { useDesign } from "@/features/design-picker";
import { useViewerState, type ViewerController } from "@/features/pattern-viewer";
import { useVersion, versionPreviewInput } from "@/features/pattern-versions";
import type { ApiError } from "@/shared/api";
import { previewErrorToApiError, usePatternPreview, type PreviewState } from "@/shared/pattern-preview";
import { useReportSelection } from "./use-report-selection";
import type { ReportSelection } from "../model/report-selection";

/** What the screen shows. */
export interface ReadOnlyVersion {
  /** The version query (loading and error). */
  readonly query: ReturnType<typeof useVersion>;
  /** The loaded detail, if any. */
  readonly detail: PatternVersionDetail | undefined;
  /** The design title, or null while loading. */
  readonly title: string | null;
  /** True when this is the design's newest version. */
  readonly isCurrent: boolean;
  /** The drawing of the stored inputs. */
  readonly preview: PreviewState;
  /** The engine failure to show instead of the drawing, if any. */
  readonly failure: ApiError | null;
  /** The viewer state. */
  readonly viewer: ViewerController;
  /** The chosen report row. */
  readonly selection: ReportSelection;
}

/**
 * Loads one version and drafts its stored inputs.
 *
 * @param designId - Design id.
 * @param versionId - Version id.
 * @returns Everything the screen shows.
 */
export function useReadOnlyVersion(designId: string, versionId: string): ReadOnlyVersion {
  const query = useVersion(versionId);
  const design = useDesign(designId);
  const viewer = useViewerState();
  const selection = useReportSelection(viewer);
  const version = query.data?.version;
  const input = useMemo(() => (version ? versionPreviewInput(version) : null), [version]);
  const preview = usePatternPreview(input);
  const failure = preview.status === "error" && preview.error ? previewErrorToApiError(preview.error) : null;
  return {
    query,
    detail: query.data,
    title: design.data?.design.title ?? null,
    isCurrent: design.data?.currentVersion?.id === versionId,
    preview,
    failure,
    viewer,
    selection,
  };
}
