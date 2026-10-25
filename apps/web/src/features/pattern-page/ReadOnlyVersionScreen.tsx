"use client";
/** The /designs/[id]/versions/[versionId] screen: an old version, view only, drawn in the worker from its stored inputs (issue #252). */
import { useLocale } from "next-intl";
import type { ReactElement } from "react";
import { RestoreVersionDialog } from "@/features/pattern-versions";
import { DataState } from "@/shared/data-state";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { ReadOnlyVersionBody } from "./components/ReadOnlyVersionBody";
import { useReadOnlyVersion } from "./hooks/use-read-only-version";
import { useRestoreAction } from "./hooks/use-restore-action";

/** Props of {@link ReadOnlyVersionScreen}. */
interface ReadOnlyVersionScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
  /** Version id from the URL. */
  readonly versionId: string;
}

/**
 * Loads one version and shows its pattern and report without any way to edit it.
 *
 * @param props - Design and version ids.
 * @returns The screen.
 */
export function ReadOnlyVersionScreen({
  designId,
  versionId,
}: Readonly<ReadOnlyVersionScreenProps>): ReactElement {
  const locale = useLocale() as AppLocale;
  const data = useReadOnlyVersion(designId, versionId);
  const restore = useRestoreAction(designId);
  const { query, detail } = data;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <DataState
        isPending={query.isPending}
        error={query.error}
        isEmpty={false}
        onRetry={() => void query.refetch()}
      >
        <ReadOnlyVersionBody
          {...data}
          backHref={`/designs/${designId}/versions`}
          onRestore={() =>
            detail && restore.ask({ id: detail.version.id, versionNo: detail.version.versionNo })
          }
        />
      </DataState>
      <RestoreVersionDialog
        versionNo={restore.asking?.versionNo ?? null}
        onClose={restore.cancel}
        onConfirm={restore.confirm}
        pending={restore.pending}
        dirty={restore.dirty}
        dir={DIRECTION[locale]}
      />
    </div>
  );
}
