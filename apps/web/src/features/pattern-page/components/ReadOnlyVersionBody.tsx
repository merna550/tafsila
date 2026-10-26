"use client";
/** The loaded old-version page: the banner, the title with its badges, the drawing, the inputs and the report. */
import { Badge, Card, PageHeader } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { ValidationReport, type ViewerController } from "@/features/pattern-viewer";
import { ReadOnlyVersionBanner, UseVersionBar } from "@/features/pattern-versions";
import type { PatternVersionDetail } from "@tafsila/schemas";
import type { ApiError } from "@/shared/api";
import type { PreviewState } from "@/shared/pattern-preview";
import type { ReportSelection } from "../model/report-selection";
import { VersionExportButton } from "./VersionExportButton";
import { VersionInputs } from "./VersionInputs";
import { ViewerPane } from "./ViewerPane";

/** Props of {@link ReadOnlyVersionBody}. */
interface ReadOnlyVersionBodyProps {
  /** The loaded version; nothing is drawn before it arrives. */
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
  /** Where "Back to the newest" goes. */
  readonly backHref: string;
  /** Asks to restore this version. */
  readonly onRestore: () => void;
}

/**
 * Renders the page once the version has loaded.
 *
 * @param props - The screen data and its two actions.
 * @returns The body, or nothing before the detail arrives.
 */
export function ReadOnlyVersionBody(props: Readonly<ReadOnlyVersionBodyProps>): ReactElement | null {
  const t = useTranslations("versionHistory");
  const { detail, preview, viewer, selection } = props;
  if (detail === undefined) return null;
  const { version, engineChanged } = detail;
  return (
    <>
      <ReadOnlyVersionBanner
        backHref={props.backHref}
        canRestore={!props.isCurrent}
        onRestore={props.onRestore}
      />
      <PageHeader
        title={props.title ?? t("fallbackTitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{t("row.version", { n: version.versionNo })}</Badge>
            <Badge tone="neutral">{t("readOnly.badge")}</Badge>
            {engineChanged ? <Badge tone="warning">{t("readOnly.engineOld")}</Badge> : null}
          </div>
        }
      />
      <UseVersionBar
        versionNo={version.versionNo}
        engineVersion={version.engineVersion}
        projectorHref={`${props.backHref}/${version.id}/projector`}
        actions={<VersionExportButton version={version} title={props.title ?? t("fallbackTitle")} />}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <ViewerPane
            scene={preview.scene}
            viewer={viewer}
            updating={false}
            error={props.failure}
            needsSet={false}
            onOpenOptions={() => undefined}
          />
        </div>
        <div className="flex flex-col gap-4 lg:w-96 lg:flex-none">
          <VersionInputs version={version} />
          {preview.result !== undefined && preview.scene !== undefined ? (
            <Card className="p-4">
              <ValidationReport
                report={preview.result.validation}
                scene={preview.scene}
                selectedKey={selection.key}
                onSelect={selection.select}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
