"use client";
/** The /designs/[id]/versions/[versionId]/cut screen: the direct-cut checklist of a saved version, with ticks and a print view (issue #291). */
import type { ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import { DirectCutBody } from "./components/DirectCutBody";
import { useDirectCut } from "./hooks/use-direct-cut";

/** Props of {@link DirectCutScreen}. */
interface DirectCutScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Version id from the URL. */
  readonly versionId: string;
}

/**
 * Loads one version and shows its marking steps.
 *
 * @param props - Design and version ids.
 * @returns The screen.
 */
export function DirectCutScreen({ designId, versionId }: Readonly<DirectCutScreenProps>): ReactElement {
  const data = useDirectCut(designId, versionId);
  const { query } = data;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <DataState
        isPending={query.isPending}
        error={query.error}
        isEmpty={false}
        onRetry={() => void query.refetch()}
      >
        <DirectCutBody data={data} versionHref={`/designs/${designId}/versions/${versionId}`} />
      </DataState>
    </div>
  );
}
